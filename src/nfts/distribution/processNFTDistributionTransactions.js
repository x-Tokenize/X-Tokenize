import { configHandler } from "../../config/configHandler.js"
import { printResponse, successMessage,  askYesNo, wait, pressAnyKey,  infoMessage, warningMessage,  importantMessage} from "../../utils/index.js"
import { getNFTokenDistributionStatus } from './getNFTokenDistributionStatus.js'
import { handleAcceptedOffer,handleIncomingPayment,handleCreatedOffer,handleCancelledOffer } from "./NFTokenDistributionHandlers.js"
import { getSortedTransactionsToHandleDistribution } from "./getNFTokenDistributionRelatedTxs.js"



/**
 * @function processDistributionTransactions
 * @description
 * Processes the distribution transactions for NFTs. It retrieves the sorted transactions related to the
 * NFT distribution and handles them accordingly based on their transaction type. The function also updates the current
 * configuration and checks the distribution status. It waits for a specified time before checking again if the
 * distribution is not complete.
 * 
 * @param {object} currentConfig - The current configuration object containing NFT and NFT_DISTRIBUTION properties.
 * @param {string} paymentAccountAddress - The payment account address associated with the NFT distribution.
 * @param {string} distributionAccountAddress - The distribution account address associated with the NFT distribution.
 * @param {number} ledgerIndexMin - The minimum ledger index to consider for the transactions.
 * @param {number} ledgerIndexMax - The maximum ledger index to consider for the transactions.
 * @returns {Promise<Object>} - An object containing the result ('success', 'warn', or 'fatal') and a message
 * describing the outcome.
 * @throws {Error} - If there is a problem processing the distribution transactions.
 */
export const processDistributionTransactions = async(currentConfig,paymentAccountAddress,distributionAccountAddress,ledgerIndexMin,ledgerIndexMax)=>{
    try{
        let sortedTransactionsResult = await getSortedTransactionsToHandleDistribution(currentConfig.NFT.networkRPC,paymentAccountAddress,distributionAccountAddress,ledgerIndexMin,ledgerIndexMax)
        printResponse(sortedTransactionsResult)
        console.log()

        if(sortedTransactionsResult.result==='success')
        {
            let nfts = currentConfig.NFT_DISTRIBUTION.nfts
            let currency= currentConfig.NFT_DISTRIBUTION.currency
            let distributionType =  currentConfig.NFT_DISTRIBUTION.distributionType
            let sortedTransactions = sortedTransactionsResult.sortedTransactions

            if(sortedTransactions.length>0)
            {
                infoMessage(`We have ${sortedTransactions.length} transactions to handle...`)
                for await(let transaction of sortedTransactions)
                {
                    let result
                    switch(transaction.tx.TransactionType)
                    {
                        case 'Payment':
                            result = distributionType==='On-Demand Distribution'?await handleIncomingPayment(nfts,currency,transaction):{result:'warn',message:'We dont process incoming payments for non on-demand distributions.'}
                            break;
                        case 'NFTokenCreateOffer':
                            result = await handleCreatedOffer(nfts,transaction)
                            break;
                        case 'NFTokenCancelOffer':
                            await handleCancelledOffer(currentConfig,wallet,transaction)
                            break;
                        case 'NFTokenAcceptOffer':
                            result = await handleAcceptedOffer(nfts,transaction)
                            break;
                        default:
                            warningMessage(`Unhandled transaction type: ${transaction.tx.TransactionType}`)
                            break;
                    }
                    if(result.result ==='fatal')
                    {
                        importantMessage(result.message)
                        await pressAnyKey()
                        return {result:'success',message:'Distribution Complete'}
                    }
                    else
                    {
                        printResponse(result)
                        await configHandler.updateCurrentConfig(currentConfig)
                    } 
                }
                currentConfig.NFT_DISTRIBUTION.lastHandledLedgerIndex = ledgerIndexMax
                await configHandler.updateCurrentConfig(currentConfig)
                getNFTokenDistributionStatus(nfts)
                infoMessage(`Waiting 2 seconds before checking again...`)
                await wait(2000)
                return {result:'warn',message:`Distribution is not complete yet.`}
            }
            else
            {
                warningMessage(`No new transactions...`)
                let {message,askToMarkAsComplete} = getNFTokenDistributionStatus(nfts,currentConfig.NFT_DISTRIBUTION.distributionType)
                
                if(askToMarkAsComplete)
                {
                    successMessage(message);
                    if(await askYesNo(`Would you like to mark the distribution as complete?`,true))
                    {
                        currentConfig.NFT_DISTRIBUTION.status = 'completed'
                        currentConfig.NFT_DISTRIBUTION.ledgerIndexEnd=currentConfig.NFT_DISTRIBUTION.lastHandledLedgerIndex
                        await configHandler.updateCurrentConfig(currentConfig)
                        return {result:'success',message:'Distribution Complete'}
                    }
                    else
                    {
                        infoMessage(`Waiting 10 seconds before checking again...`)
                        await wait(10000)
                        return {result:'warn',message:`Distribution is not complete yet.`}
                    }
                }
                else if(distributionType ==='Simple Distribution' || distributionType === 'Trustline Distribution')
                {
                    infoMessage(`Since we are not actively processing payments you can come back later to check the status of the distribution.`)
                    if(await askYesNo(`Would you like to comeback later to check the status of the distribution?`,true))
                    {
                        return {result:'success',message:'Coming back later to check the status of the distribution'}
                    }
                    else 
                    {
                        infoMessage(`Waiting 10 seconds before checking again...`)
                        await wait(10000)
                        return {result:'warn',message:`Distribution is not complete yet.`}
                    }
                }
                else
                {
                    infoMessage(`Waiting 10 seconds before checking again...`)
                    await wait(10000)
                    return {result:'warn',message:`Distribution is not complete yet.`}
                }
            
            }
        }
        else
        {
            return {result:'warn',message:`There was a problem getting the sorted transactions.`}
        }
    }
    catch(err)
    {
        console.log("There was a problem processing the distribution transactions: ",err)
    }
}