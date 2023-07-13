import { longRequest } from "../core/requests.js"

/**
 * @function getNFTokenOffers
 * @description
 * Retrieves the buy and sell offers for a specific Non-Fungible Token (NFT) on the XRPL. It sends two
 * separate requests to the XRPL network, one for buy offers and one for sell offers, and returns the combined results.
 * 
 * @param {string} networkRPC - The XRPL network RPC URL to send requests to.
 * @param {string} NFTokenID - The unique identifier of the NFT for which offers are to be retrieved.
 * @returns {Promise<Object>} - An object containing the result status, a message, and the buy and sell
 * offers for the NFT.
 * @throws {Error} - Throws an error if there is a problem retrieving the NFT offers.
 */
export const getNFTokenOffers = async(networkRPC,NFTokenID)=>{
    try
    {
        let nftBuyOffersRequest = {'method':'nft_buy_offers','params':[{'nft_id':NFTokenID,'ledger_index':'current'}]}
        let nftSellOffersRequest = {'method':'nft_sell_offers','params':[{'nft_id':NFTokenID,'ledger_index':'current'}]}

        let buyOffers = await longRequest("offers",nftBuyOffersRequest,networkRPC)
        let sellOffers = await longRequest("offers",nftSellOffersRequest,networkRPC)
        if(buyOffers && sellOffers) return {result:'success',message:'Successfully retrieved NFT offers.',buyOffers,sellOffers}
        else{
            console.log('There was a problem getting the NFT offers: ',err)
            return {result:'warn',message:`There was a problem nft offers for the ${NFTokenID}.`}
        }
    }
    catch(err)
    {
        console.log('There was a problem getting the NFT offers: ',err)
    }
}