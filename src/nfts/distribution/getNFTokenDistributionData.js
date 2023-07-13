import { configHandler } from "../../config/configHandler.js"
import { printBanner, table } from "../../utils/index.js";
import {getNFTokenDistributionStatus} from './getNFTokenDistributionStatus.js'

/**
 * @function getNFTokenDistributionData
 * @description
 * Retrieves the distribution data for NFTs in the current configuration. This includes the status of the
 * distribution, starting and ending ledger indices, unique buyers, total NFTs purchased, and the total value of sales.
 * The function filters the accepted NFT offers and calculates the total value distributed based on the purchasing
 * price. It also counts the unique buyers and displays the data in a table format.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the operation result.
 * @throws {Error} - If there is a problem getting the distribution data.
 */

export const getNFTokenDistributionData = async()=>{
    try
    {
        let currentConfig = await configHandler.getConfigs();
        let nfts = currentConfig.NFT_DISTRIBUTION.nfts;
        printBanner()
        getNFTokenDistributionStatus(nfts);
        
        let accepted = nfts.filter((nft)=>nft.acceptOffer.finalTxResult==='tesSUCCESS');
        let {type,currency,issuer,amount,code,hex} = currentConfig.NFT_DISTRIBUTION.currency;
        let totalValueDistributedNative = accepted.length*Number(amount)+` ${type==='IC'?`${code}`:'Drops'}`
        //successMessage(`Total value distributed based on purchasing price was: ${totalValueDistributedNative}`)
        
        let uniqueAcceptors = new Set();
        accepted.forEach((nft)=>{uniqueAcceptors.add(nft.acceptOffer.address)})
        
        // nfts.forEach((nftz)=>{if(!Array.from(uniqueAcceptors).some((nft)=>{return(nft.acceptOffer.address===nftz.acceptOffer.address)})){uniqueAcceptors.add(nftz.acceptOffer.address)}})

        let data ={
            "Status":currentConfig.NFT_DISTRIBUTION.status,
            "Starting Ledger":currentConfig.NFT_DISTRIBUTION.ledgerIndexStart,
            "Ending Ledger":currentConfig.NFT_DISTRIBUTION.ledgerIndexEnd?currentConfig.NFT_DISTRIBUTION.ledgerIndexEnd:'Still Active',
            "Unique Buyers":uniqueAcceptors.size,
            "Total NFTs Purchased":accepted.length,
            "Total Value of Sales":totalValueDistributedNative
        }
        table([data])
        return {result:'success',message:'The distribution data was retrieved successfully.'}
    }
    catch(err)
    {
        console.log(`There was a problem getting the distribution data: ${err}`)
    }
}