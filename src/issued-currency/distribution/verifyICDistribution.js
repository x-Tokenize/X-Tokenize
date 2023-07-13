import {configHandler} from '../../config/configHandler.js'
import { printBanner,printResponse,createSpinner,infoMessage,warningMessage,askWhichFromList,askYesNo,printQR,pressAnyKey} from '../../utils/index.js'
import { getAccountTransactions,getLatestLedger } from '../../xrpl/index.js'


/**
 * @function isDistributionReadyForVerification
 * @description
 * Determines if the Issued Currency distribution is ready for verification by checking the distribution
 * status, pending lines, and ledger index.
 * 
 * @param {Object} currentConfig - The current configuration object containing IC, IC_DISTRIBUTION, and XTOKENIZE_SETTINGS properties.
* @returns {OperationResult} - An object containing the result and a message describing if the distribution is ready for verification.
 * @throws {Error} - If there is a problem preparing the distribution for verification.
 */
export const isDistributionReadyForVerification = async(currentConfig)=>{
    try
    {
        printBanner()
        let IC = currentConfig.IC
        let IC_DISTRIBUTION = currentConfig.IC_DISTRIBUTION
        let XTOKENIZE_SETTINGS = currentConfig.XTOKENIZE_SETTINGS
        let {networkRPC} = IC
        let {status,lines,ledgerIndexEnd}=IC_DISTRIBUTION
        if(status==='completed') return {result:'warn',message:`The distribution has already been completed.`}
        else
        {
            let pendingLines = lines.filter((line)=>{return line.status==='pending'})
            if(pendingLines.length>0) return {result:'warn',message:`There are still ${pendingLines.length} pending lines. Please run the distribution again.`}
            else
            {
                let latestLedgerResponse = await getLatestLedger(networkRPC)
                printResponse(latestLedgerResponse)
                console.log()
                if(latestLedgerResponse.result!=='success') return {result:'warn',message:`There was a problem getting the latest ledger: ${latestLedgerResponse.message}`}
                else
                {
                    let latestLedger = Number(latestLedgerResponse.ledger.ledger_index)
                    let ledgerBeforeVerification = Number(ledgerIndexEnd)+XTOKENIZE_SETTINGS.max_ledger_offset
                    if(latestLedger<ledgerBeforeVerification) return {result:'warn',message:`The latest ledger index is ${latestLedger}. Please wait until the ledger index is at least ${ledgerBeforeVerification} before verifying the distribution.`}
                    else return {result:'success',message:`The distribution is ready for verification.`,}
                }
            }
        }
    }
    catch(err)
    {
        console.log(`There was a problem preparing the distribution for verificaiton: ${err}`)
    }
}



/**
 * @function verifyICDistribution
 * @description
 * Verifies the Issued Currency distribution by checking the transaction status, delivered amount, and
 * final transaction result for each line in the distribution.
 * Updates the distribution status and line status accordingly. Also provides options to reset lines or
 * change their status if needed.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the verification process.
 * @throws {Error} - If there is a problem verifying the distribution.
 */
export const verifyICDistribution = async()=>{
    try
    {
        printBanner()
        let currentConfig = configHandler.getConfigs();
        let IC = currentConfig.IC
        let IC_DISTRIBUTION = currentConfig.IC_DISTRIBUTION
        let XTOKENIZE_SETTINGS = currentConfig.XTOKENIZE_SETTINGS
        let {network,networkRPC,currencyHex,issuer} = IC
        let {ledgerIndexStart,distributionWallet}=IC_DISTRIBUTION
        let verificationReady = await isDistributionReadyForVerification(currentConfig)
        if(verificationReady.result!=='success') return verificationReady
        else
        {
            let accountTXOptions = {ledger_index_min:Number(ledgerIndexStart)-5,ledger_index_max:undefined, ledger_hash:undefined,ledger_index:undefined, binary:undefined,forward:true,limit:undefined}
            let distributionAccountTxs = await getAccountTransactions(networkRPC,distributionWallet.address,accountTXOptions)
            printResponse(distributionAccountTxs)
            if(distributionAccountTxs.result!=='success') return {result:'failed',message:`There was a problem getting the distribution wallet's transactions.`}
            else
            {
                let {transactions}= distributionAccountTxs
                let lines = IC_DISTRIBUTION.lines;
                let spinner = await createSpinner(`Verifying the distribution... 0/${lines.length} verifications completed.`)

                for(let i=0; i<lines.length;i++)
                {
                    let line = lines[i]
                    if(line.status ==='sent' && line.limitExceeded===false && line.txHash!==null)
                    {
                        let txFound = transactions.find((transaction)=>{return transaction.tx.hash===line.txHash})
                        if(txFound)
                        {
                            let finalTxResult = txFound.meta.TransactionResult
                            let inLedger = txFound.tx.inLedger

                            let deliveredAmount = txFound.meta.delivered_amount
                            if(finalTxResult==='tesSUCCESS' && deliveredAmount.value===line.amount && deliveredAmount.issuer===issuer.address && deliveredAmount.currency ===currencyHex)
                            {
                                line.status='verified'
                                line.finalResult = finalTxResult
                                line.ledgerIndex=inLedger
                                IC_DISTRIBUTION.successfulDistributions++;

                            }
                            else
                            {
                                spinner.stop()
                                console.log('Current Line:',line)
                                console.log('Delivered Amount:',deliveredAmount)
                                console.log('Final Tx Result:',finalTxResult)
                                warningMessage(`It looks like this tx failed with resulting code: ${finalTxResult}`)
                                let bithompPrefix = network==='mainnet'?'https://bithomp.com/explorer/':'https://test.bithomp.com/explorer/'
                                let link = bithompPrefix+line.txHash
                                if(await askYesNo(`Would you like to show a qr code for the transaction to view on the bithomp explorer?`,true)) await printQR(link)
                                infoMessage(`You can view the transaction here: ${link}`)
                                let setStatus =await askWhichFromList(`What would you like to set the status of this line to?`,['verified','failed','pending'])
                                line.status=setStatus
                                switch(setStatus)
                                {
                                    case 'verified':
                                        line.finalResult = finalTxResult
                                        line.ledgerIndex=inLedger
                                        IC_DISTRIBUTION.successfulDistributions++;
                                        break;
                                    case 'failed':
                                        line.finalResult = finalTxResult
                                        line.ledgerIndex=inLedger
                                        IC_DISTRIBUTION.failedDistributions++;
                                        break;
                                    case 'pending':
                                        if(IC_DISTRIBUTION.status !== 'pending')IC_DISTRIBUTION.status='pending'
                                        line.finalResult = null
                                        line.txHash=null
                                        line.preliminaryResult=null
                                }
                                
                                spinner.start()
                            }
                        }
                        else
                        {
                            spinner.stop()
                            warningMessage(`It looks like the following transaction hash from the distribution was not found in the distribution wallet's transactions.`)
                            infoMessage(`Transaction submission prelimary result: ${line.preliminaryResult}`)
                            infoMessage(`Intended Recipient: ${line.account}`)
                            infoMessage(`TX Hash: ${line.txHash}`)
                            if(await askYesNo(`Would you like to reset this line and try again by running another distribution?`,true))
                            {
                                if(IC_DISTRIBUTION.status !== 'pending')IC_DISTRIBUTION.status='pending'
                                line.status='pending'
                                line.txHash=null
                                line.preliminaryResult=null
                            }
                            else
                            {
                                line.status='failed'
                                line.finalResult = 'txNotFound'
                                line.ledgerIndex=null
                                IC_DISTRIBUTION.failedDistributions++;
                            }
                            spinner.start()
                        }
                    }
                    await configHandler.updateCurrentConfig(currentConfig)
                    spinner.message(`Verifying the distribution... ${i+1}/${lines.length} verifications completed.`)
                }
                spinner.stop();
                let pendingLines = lines.filter((line)=>{return line.status==='pending'})
                if(pendingLines.length>0) IC_DISTRIBUTION.status= 'pending';
                else IC_DISTRIBUTION.status= 'completed';
            
                await configHandler.updateCurrentConfig(currentConfig)
                infoMessage(`Finished verifying the distribution.`)
                infoMessage(`Total lines: ${lines.length}`)
                infoMessage(`Successfull distributions: ${IC_DISTRIBUTION.successfulDistributions}`)
                infoMessage(`Failed distributions: ${IC_DISTRIBUTION.failedDistributions}`)
                infoMessage(`Pending distributions: ${pendingLines.length}`)
                await pressAnyKey()
                return {result:'success',message:`The distribution has been verified.`}
            }
        }    
    }
    catch(err)
    {
        console.log('There was a problem verifying the distribution:',err)
    }
}

