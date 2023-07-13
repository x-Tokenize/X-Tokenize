import { configHandler } from "../../config/configHandler.js"
import { printResponse,  wait, shuffleArray, warningMessage,} from "../../utils/index.js"
import { getLatestLedger } from "../../xrpl/index.js"


/**
 * @function initializeNFTokenDistribution
 * @description
 * This function initializes the NFT distribution process by updating the current configuration object
 * with the latest ledger index, setting the distribution status to active, and shuffling the NFT array. It also handles
 * various distribution status cases and retries the initialization process if there's an issue with the network RPC.
 * 
 * @param {Object} currentConfig - The current configuration object containing NFT and NFT_DISTRIBUTION properties.
 * @returns {Promise<Object>} - An object containing the result ('success', 'warn', or 'error'), a message
 * describing the outcome, and the ledgerIndexMax (if applicable).
 * @throws {Error} - If there's a problem initializing the distribution.
 */
export const initializeNFTokenDistribution = async(currentConfig)=>{
    try
    {
        let ledgerIndexMaxResponse=await getLatestLedger(currentConfig.NFT.networkRPC)
        printResponse(ledgerIndexMaxResponse)
        console.log()
        if(ledgerIndexMaxResponse.result==='success')
        {
            let ledgerIndexMax= Number(ledgerIndexMaxResponse.ledger.ledger_index)
            if(currentConfig.NFT_DISTRIBUTION.status ==='created')
            {
                currentConfig.NFT_DISTRIBUTION.status='active'
                currentConfig.NFT_DISTRIBUTION.ledgerIndexStart = ledgerIndexMax;
                currentConfig.NFT_DISTRIBUTION.lastHandledLedgerIndex = ledgerIndexMax;
                currentConfig.NFT_DISTRIBUTION.nfts=shuffleArray([...currentConfig.NFT_DISTRIBUTION.nfts],100);
                await configHandler.updateCurrentConfig(currentConfig)
                return {result:'success',message:'Successfully initialized the distribution',ledgerIndexMax:ledgerIndexMax}
            }
            else if(currentConfig.NFT_DISTRIBUTION.status === 'active')return {result:'success',message:'The distribution is already active.',ledgerIndexMax:ledgerIndexMax}
            else if(currentConfig.NFT_DISTRIBUTION.status === 'completed')return {result:'warn',message:'The distribution is already completed.'}
            else return {result:'warn',message:'The distribution is not ready to be initialized.'}
        }
        else 
        {
            warningMessage(`There was a problem attempting to initialize the distribution. Trying again in 10 seconds...`)
            await wait(10000)
            return await initializeNFTokenDistribution(currentConfig)
        }
    }
    catch(err)
    {
        console.log('There was a problem initializing the distribution:',err)
    }
}