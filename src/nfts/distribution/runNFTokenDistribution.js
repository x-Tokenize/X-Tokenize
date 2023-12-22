import xrpl from 'xrpl'
import { configHandler } from "../../config/configHandler.js"
import { printResponse, successMessage, printBanner, askYesNo, wait, pressAnyKey, shuffleArray, infoMessage, warningMessage,  importantMessage, fancyMessage} from "../../utils/index.js"
import {getWalletFromEncryptedSeed,createNFTokenOffer,getLatestLedger, getAccountTransactions } from "../../xrpl/index.js"
import { isNFTokenDistributionReady } from "./isNFTokenDistributionReady.js"
import { handleCreateOffer } from './NFTokenDistributionHandlers.js'
import { processDistributionTransactions } from './processNFTDistributionTransactions.js'
import { initializeNFTokenDistribution } from './initializeNFTokenDistribution.js'


/**
 * @function runSimpleDistribution
 * @description
 * Executes a simple distribution of NFTs. It initializes the distribution, creates offers for pending
 * NFTs, and processes the distribution transactions.
 * 
 * @param {object} wallet - The wallet object containing the address and seed information.
 * @returns {Promise<Object>} - An object containing the result and message of the distribution process.
 * @throws {string} - Error message if there's a problem running the simple distribution.
 */
export const runSimpleDistribution = async(wallet)=>{
        try
        {
            let currentConfig = await configHandler.getConfigs()
            let {NFT_DISTRIBUTION} = currentConfig
            printBanner()
            let initializeResult = await initializeNFTokenDistribution(currentConfig);
            printResponse(initializeResult)
            console.log()
            if(initializeResult.result!=='success') return initializeResult
            else
            {
                let ledgerIndexMin = NFT_DISTRIBUTION.lastHandledLedgerIndex;
                let ledgerIndexMax = initializeResult.ledgerIndexMax;
                let nfts = NFT_DISTRIBUTION.nfts
                 let pendingNFTs = nfts.filter(nft=>(nft.status==='pending' && nft.offer.offerID===null && nft.offer.txHash===null))
                if(pendingNFTs.length>0)
                {
                    infoMessage(`We have ${pendingNFTs.length} pending NFTs.`)
                    for await(let nft of pendingNFTs){await handleCreateOffer(currentConfig,wallet,nft) }
                    infoMessage(`Waiting 10 seconds before processing the distribution...`)
                    await wait(10000)
                    return await runSimpleDistribution(wallet)
                }
                else
                {
                  let processResult = await processDistributionTransactions(currentConfig,null,wallet.address,ledgerIndexMin,ledgerIndexMax)
                    if(processResult.result==='success') return processResult
                    else
                    {
                        printResponse(processResult)
                        return await runSimpleDistribution(wallet)
                    } 
                }
            }
        }
        catch(err)
        {
            console.log('There was a problem running the simple distribution:',err)
        }
}

/**
 * @function runOnDemandDistribution
 * @description
 * Executes an on-demand distribution of NFTs. It initializes the distribution, handles purchased NFTs,
 * and processes the distribution transactions.
 * 
 * @param {object} wallet - The wallet object containing the address and seed information.
 * @returns {Promise<Object>} - An object containing the result and message of the distribution process.
 * @throws {string} - Error message if there's a problem running the on-demand distribution.
 */
export const runOnDemandDistribution= async(wallet)=>{
        try
        {
            let currentConfig = await configHandler.getConfigs()
            let {NFT,NFT_DISTRIBUTION} = currentConfig;
            let paymentAccountAddress = currentConfig.NFT_DISTRIBUTION.paymentAccount===null?null:currentConfig.NFT_DISTRIBUTION.paymentAccount.address
            printBanner()
            let initializeResult = await initializeNFTokenDistribution(currentConfig)
            printResponse(initializeResult)
            console.log()
            if(initializeResult.result!=='success') return initializeResult
            else
            {
                let ledgerIndexMin = currentConfig.NFT_DISTRIBUTION.lastHandledLedgerIndex;
                let ledgerIndexMax = initializeResult.ledgerIndexMax;
            
                let nfts = NFT_DISTRIBUTION.nfts
                let unhandledPurchasedNFTs = nfts.filter(nft=>(nft.status==='purchased' && nft.offer.offerID===null&& nft.offer.txHash===null&& nft.purchase.txHash!==null&& nft.purchase.finalTxResult==='tesSUCCESS'))
                if(unhandledPurchasedNFTs.length>0)
                {
                    infoMessage(`We have ${unhandledPurchasedNFTs.length} unhandled purchased NFTs.`)
                    for await(let nft of unhandledPurchasedNFTs){ await handleCreateOffer(currentConfig,wallet,nft)}
                    infoMessage(`Waiting 10 seconds before processing the distribution...`)
                    await wait(10000)
                    return await runOnDemandDistribution(wallet)
                }
                else
                {
                    let processResult = await processDistributionTransactions(currentConfig,paymentAccountAddress,wallet.address,ledgerIndexMin,ledgerIndexMax)
                    if(processResult.result==='success') return processResult
                    else
                    {
                        printResponse(processResult)
                        return await runOnDemandDistribution(wallet)
                    } 
                }
            } 
        }
        catch(err)
        {
            console.log('There was a problem running the on demand distribution: ',err)
        }
}

/**
 * @function runTrustlineDistribution
 * @description
 * Executes a trustline distribution of NFTs. This feature is coming soon.
 * 
 * @param {object} wallet - The wallet object containing the address and seed information.
 * @returns {Promise<Object>} - An object containing the result and message of the distribution process.
 * @throws {string} - Error message if there's a problem running the trustline distribution.
 */
export const runTrustlineDistribution= async(wallet)=>{
        try{
            fancyMessage(`Coming soon!`)
            return {result:'success',message:`The trustline distribution was successful.`}
        }
        catch(err)
        {
            console.log('There was a problem running the simple distribution: ',err)
        }
}

/**
 * @function runNFTokenDistribution
 * @description
 * Executes the NFT distribution based on the distribution type specified in the configuration. It checks
 * if the distribution is ready to run, and then runs the corresponding distribution method.
 * 
 * @returns {Promise<Object>} - An object containing the result and message of the distribution process.
 * @throws {string} - Error message if there's a problem running the NFToken distribution.
 */
export const runNFTokenDistribution = async()=>{
        try{
            let currentConfig = await configHandler.getConfigs()
            let {NFT,NFT_DISTRIBUTION} = currentConfig;
            let {network,networkRPC,minter,authorizedMinting,authorizedMinter}=NFT
            let {status,distributionType,paymentAccount,currency,nfts}=NFT_DISTRIBUTION
            printBanner()
            if(status ==='completed') return {result:'warn',message:`The NFToken distribution has already been completed.`}
            else if (status==='active' || status === 'created')
            {
                let distributionReady = await isNFTokenDistributionReady(network,networkRPC,nfts,distributionType,paymentAccount,currency, minter,authorizedMinting,authorizedMinter);
                if(distributionReady)
                {
                    printBanner()
                    successMessage(`The NFToken distribution is ready to run.`)
                    console.log();
                    if(await askYesNo(`Would you like to run the distribution?`,true))
                    {
                        let distributionWallet = authorizedMinting?authorizedMinter:minter
                        let {address,seed,seedEncrypted} = distributionWallet
                        let wallet = seedEncrypted?await getWalletFromEncryptedSeed(address,seed):xrpl.Wallet.fromSeed(seed)
                        let distributionResult
                        switch(distributionType)
                        {
                            case 'Simple Distribution':
                                distributionResult = await runSimpleDistribution(wallet)
                                break;
                            case 'On-Demand Distribution':
                                distributionResult = await runOnDemandDistribution(wallet)
                                break;
                            case 'Trustline Distribution':
                                distributionResult = await runTrustlineDistribution(wallet)
                                break;
                            default:
                                distributionResult = {result:'failed',message:`The distribution type ${distributionType} is not supported.`}
                                break;
                        }
                       // printResponse(distributionResult)
                        return distributionResult
                    }
                    else return {result:'warn',message:`User declined to run the NFT distribution.`}
                }
            }
            else if(status==='failed')
            {
                //TODO: ADD FAILURE RECOVERY.
                return {result:'warn',message:`The NFToken distribution failed. Check the logs to see what happened.`}
            }
            else return {result:'warn',message:`The NFToken distribution is in an unknown state. Did you modify the config file?`}
        }
        catch(err)
        {
            console.log('There was a problem running the NFToken distribution:',err)
        }
}