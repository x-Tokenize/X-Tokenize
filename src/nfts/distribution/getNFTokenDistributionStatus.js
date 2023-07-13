import { table } from "../../utils/index.js";


/**
 * @function getNFTokenDistributionStatus
 * @description
 * Analyzes the distribution status of an array of NFTs by filtering the NFTs based on their status
 * property. The function calculates the number of NFTs in each status category (pending, purchased, offer-sent,
 * offer-created, offer-accepted, and failed) and displays the results in a table format. It then determines if the
 * distribution is ready to be marked as complete based on the number of NFTs in the accepted and failed categories.
 * Finally, it returns an object containing a boolean value indicating if the distribution is ready to be marked as
 * complete and a message describing the current status.
 * 
 * @param {Array} nfts - An array of NFT objects, each containing a 'status' property.
 * @returns {Object} - An object containing 'askToMarkAsComplete' (boolean) and 'message' (string) properties.
 */
export const getNFTokenDistributionStatus = (nfts) =>{

    let pending = nfts.filter(nft=>nft.status==='pending').length
    let purchased = nfts.filter(nft=>nft.status==='purchased').length
    let offerSent = nfts.filter(nft=>nft.status==='offer-sent').length
    let created= nfts.filter(nft=>nft.status==='offer-created').length
    let accepted = nfts.filter(nft=>nft.status==='offer-accepted').length
    let failed = nfts.filter(nft=>nft.status==='failed').length
    let totalNFTs = nfts.length

    let data =[
        {
            'Total NFTs':totalNFTs,
            'Pending':pending,
            'Purchased':purchased,
            'Offer Sent':offerSent,
            'Offer Created':created,
            'Offer Accepted':accepted,
            'Failed':failed,
        }
    ]
    table(data)

    let askToMarkAsComplete = false;
    let message =`Not ready to complete.`
    if(totalNFTs === accepted) 
    {
        askToMarkAsComplete = true
        message = `All NFTs have been purchased. You can now mark this distribution as complete.`
    }
    else if(totalNFTs === accepted+failed)
    {
        askToMarkAsComplete=true;
        message = `All NFTs have purchased or failed. You can handle to failed distributions manually in the NFT tools.`
    }

    return {askToMarkAsComplete,message}
   
}
