import { askYesNo, createSpinner, infoMessage, pressAnyKey, printBanner, successMessage, warningMessage,printQR, askWhichFromList,table, wait} from "../../utils/index.js"
import { checkAccountExists,getSpecificTrustline,setTrustline,sendIssuedCurrency,getLatestLedger,getAccountTransactions } from "../../xrpl/index.js"
import { configHandler } from "../../config/configHandler.js"
import { printResponse } from "../../utils/index.js"
import { getWalletFromEncryptedSeed } from "../../xrpl/wallets/getWalletFromEncryptedSeed.js"
import xrpl from 'xrpl'


/**
 * @function isICDistributionReady
 * @description
 * Checks if the Issued Currency distribution is ready to run by verifying the distribution wallet's
 * existence, trustline, and funding status.
 * 
 * @param {string} network - The network to be used.
 * @param {string} networkRPC - The network RPC URL.
 * @param {Array} lines - The distribution lines.
 * @param {Object} distributionWallet - The distribution wallet object.
 * @param {string} currencyCode - The currency code of the Issued Currency.
 * @param {string} currencyHex - The currency hex code of the Issued Currency.
 * @param {string} issuerAddress - The address of the Issued Currency issuer.
 * @param {Object} treasury - The treasury wallet object.
 * @returns {Promise<boolean>} - Returns true if the distribution is ready to run, false otherwise.
 * @throws {Error} - Throws an error if there is a problem checking if the distribution is ready to run.
 */
export const isICDistributionReady = async (network,networkRPC,lines,distributionWallet,currencyCode,currencyHex,issuerAddress,treasury) => {
        try
        {

            let txOptions = {verify:true,verbose:true,txMessage:null,askConfirmation:true}
            let distributorChecked= false
            let distributorTrustline= false
            let distributorTrustlineReady= false
            let distributorFunded= false
            let distributionWalletBalance = 0
            printBanner()
            infoMessage(`Checking if the distribution is ready to run...`)
            console.log()

            infoMessage(`Checking if the distribution wallet exists...`)
            let distributionWalletExists = await checkAccountExists(network,networkRPC,distributionWallet.address)
            if(distributionWalletExists.result ==='success') distributorChecked = true;
            printResponse(distributionWalletExists)
            console.log()
            

            if(distributorChecked)
            {
                infoMessage(`Checking if the distribution wallet's trustline is ready...`)
                distributorTrustline = await getSpecificTrustline(networkRPC,currencyHex,issuerAddress,distributionWallet.address)
                printResponse(distributorTrustline)
                console.log()
                if(distributorTrustline.result==='success') distributorTrustlineReady = true;
                else if(distributorTrustline.result==='warn')
                {
                    distributorTrustline = await setTrustline(networkRPC,issuerAddress,currencyHex,distributionWallet,{},txOptions)
                    printResponse(distributorTrustline)
                    if(distributorTrustline.result==='success') distributorTrustlineReady = true;
                    console.log()
                }
            }

            if(distributorTrustlineReady)
            {
                let tokenBalance = distributorTrustline.trustline.balance
                infoMessage(`Checking if the distribution wallet needs additional funding...`)
                let balanceNeeded=0;
                lines.forEach((line)=>{if(line.status==='pending' && line.limitExceeded===false && line.txHash ==null) balanceNeeded +=Number(line.amount)})
                let fundingAmount = Math.ceil(Number(balanceNeeded)-Number(tokenBalance))
                if(fundingAmount>0){
                    infoMessage(`The distribution wallet needs ${fundingAmount} $${currencyCode} to complete the distribution.`)
                    console.log()
                    infoMessage(`Checking if the treasury has enough funds to fund the distribution...`)
                    let treasuryChecked = await getSpecificTrustline(networkRPC,currencyHex,issuerAddress,treasury.address)
                    printResponse(treasuryChecked)
                    console.log()

                    if(treasuryChecked.result==='success')
                    {
                        let treasuryBalance = Number(treasuryChecked.trustline.balance)
                        if(Number(treasuryBalance)>fundingAmount)
                        {
                            infoMessage(`The treasury has enough funds to fund the distribution wallet.`)
                            if(await askYesNo(`Do you want to fund the distribution wallet?`))
                            {
                                let fundingResult = await sendIssuedCurrency(networkRPC,treasury,distributionWallet.address,currencyCode,{currency:currencyHex,issuer:issuerAddress,value:fundingAmount.toString()},txOptions)
                                printResponse(fundingResult)
                                console.log()
                                if(fundingResult.result==='success') distributorFunded=true
                                else 
                                {
                                    warningMessage(`There was a problem funding the distribution wallet.`)
                                    distributorFunded = false
                                }
                            }
                            else 
                            {
                                warningMessage(`User declined to fund the distribution wallet.`)
                                distributorFunded = false
                            }
                        }
                        else 
                        {
                            warningMessage(`The treasury does not have enough funds to fund the distribution wallet.`)
                            infoMessage(`Treasury balance: ${treasuryBalance} | Amount needed: ${fundingAmount}`)
                            distributorFunded = false
                        }
                    }
                    else
                    {
                        warningMessage(`There was a problem checking if the treasury has enough funds.`)
                        distributorFunded = false
                    }
                }
                else
                {
                    successMessage(`The distribution wallet has enough funds to complete the distribution.`)
                    distributorFunded=true
                }
                console.log()
             
            }

            if(distributorChecked && distributorTrustlineReady && distributorFunded) return true
            else
            {
                warningMessage(`Some of the prequisites for the distribution are not met.`)
                infoMessage(`Distribution wallet exists: ${distributorChecked}`)
                infoMessage(`Distribution wallet trustline is ready: ${distributorTrustlineReady}`)
                infoMessage(`Distribution wallet is funded: ${distributorFunded}`)
                return false
            }

        }
        catch(err)
        {
            console.log('There was a problem checking is the distrbution is ready to run:',err)
        }
}


/**
 * @function distributeIC
 * @description
 * Distributes the Issued Currency to the specified recipients by sending transactions and updating the
 * distribution lines in the configuration.
 * 
 * @param {Object} wallet - The wallet object to be used for sending transactions.
  * @returns {OperationResult} - An object containing the result and a message describing the outcome of the IC distribution process.
 * @throws {Error} - Throws an error if there is a problem distributing the Issued Currency.
 */
export const distributeIC = async(wallet) => {
    try
    {
        printBanner()
        let currentConfig = configHandler.getConfigs();
        let IC = currentConfig.IC
        let IC_DISTRIBUTION = currentConfig.IC_DISTRIBUTION
        let {throttle,txs_before_sleep,sleep_time}=currentConfig.XTOKENIZE_SETTINGS
        let {network,networkRPC,currencyCode,currencyHex,issuer} = IC
        let {status,lines,ledgerIndexStart }=IC_DISTRIBUTION
        if(status==='completed') return {result:'success',message:'The distribution has already been completed.'}
        else if(status==='created'){
            let ledgerResponse = await getLatestLedger(networkRPC)
            printResponse(ledgerResponse)
            if(ledgerResponse.result==='success')
            {
                IC_DISTRIBUTION.status='active'
                IC_DISTRIBUTION.ledgerIndexStart = ledgerResponse.ledger.ledger_index
                configHandler.updateCurrentConfig(currentConfig)
                return await distributeIC(wallet)
            }
            else return {result:'failed',message:'There was problem initializing the distribution.'}
        }
        else
        {
            let lines = IC_DISTRIBUTION.lines
            let txOptions = {verify:false,verbose:false,txMessage:null,askConfirmation:false}
            
            let spinner = await createSpinner(`Executing Distribution... 0/${lines.length} lines completed.`)
            let txsSent=0;
            for(let i=0;i<lines.length;i++)
            {
                let line = lines[i]
                if(line.status==='pending' && line.limitExceeded===false && line.txHash ==null)
                {
                    
                    let amount =line.amount
                    let destination = line.account
                    let sendResult = await sendIssuedCurrency(
                        networkRPC,
                        wallet,
                        destination,
                        currencyCode,
                        {
                            currency:currencyHex,
                            issuer:issuer.address,
                            value:amount.toString()
                        },
                        txOptions)
                    
                        line.preliminaryResult = sendResult.code
                        line.txHash = sendResult.hash;
                        line.status='sent'
                        configHandler.updateCurrentConfig(currentConfig)
                        txsSent++;
                        if(txs_before_sleep!==0)
                        {
                            if(txsSent%txs_before_sleep===0)
                            {
                                spinner.message(`Sleeping for ${sleep_time} ms.                                   `)
                                await wait(sleep_time)
                            }
                        }
                        await wait(throttle)
                }
                    spinner.message(`Executing Distribution... ${i+1}/${lines.length} lines completed.`) 
            }
            spinner.stop()
            let ledgerIndexEndResponse = await getLatestLedger(networkRPC)
            printResponse(ledgerIndexEndResponse)
            if(ledgerIndexEndResponse.result ==='success') IC_DISTRIBUTION.ledgerIndexEnd = ledgerIndexEndResponse.ledger.ledger_index
            IC_DISTRIBUTION.status='pendingVerification'
            configHandler.updateCurrentConfig(currentConfig)
            return {result:'success',message:'The IC distribution has been completed.'}
        }
    }
    catch(err)
    {
        console.log("There was a problem distributing the IC:",err)
    }
}


/**
 * @function runICDistribution
 * @description
 * Runs the Issued Currency distribution process by checking if the distribution is ready to run, and if
 * so, proceeds with the distribution.
 * 
 * @returns {Promise<Object>} - Returns an object containing the result and message of the distribution process.
 * @throws {Error} - Throws an error if there is a problem running the IC distribution.
 */
export const runICDistribution = async()=>{
        try
        {
            let currentConfig = await configHandler.getConfigs();
            let {IC,IC_DISTRIBUTION} = currentConfig
            let {network,networkRPC,currencyCode,currencyHex,issuer,treasury} = IC
            let {status,distributionWallet,lines }=IC_DISTRIBUTION
            printBanner()
            if(status==='completed') return {result:'warn',message:'The IC distribution has already been completed.'}
            else if(status =='pendingVerification') return {result:'warn',message:'The IC distribution is pending verification. Go back and verify the distribution before attempting to run it again.'}
            else
            {
                let distributionReady = await isICDistributionReady(network,networkRPC,lines,distributionWallet,currencyCode,currencyHex,issuer.address,treasury,)
                if(!distributionReady) return {result:'warn',message:'The IC distribution is not ready to run.'}
                else
                {
                    successMessage(`The IC distribution is ready to run.`)
                    console.log()
                    if(await askYesNo('Would you like to run the distribution?',true))
                    {
                        let {address,seed,seedEncrypted} = distributionWallet
                        let wallet = seedEncrypted?await getWalletFromEncryptedSeed(address,seed):xrpl.Wallet.fromSeed(seed)
                        let distributionResult = await distributeIC(wallet)
                        printResponse(distributionResult)
                        console.log()
                        if(distributionResult.result ==='success') return {result:'success',message:'The IC distribution was successful.'}
                        else return {result:'warn',message:'The IC distribution was not successful.'}
                    }
                    else return {result:'warn',message:'User declined to run the IC distribution.'}
                }
            }
        }
        catch(err)
        {
            console.log('There was a problem running the IC distribution:',err)
        }
}