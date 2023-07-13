import { askWhichFromList,infoMessage, pressAnyKey, printBanner, warningMessage,} from "../../utils/index.js";
import { printNFTOffer,printNFTOffers } from "./printNFTokenOffers.js";
import { acceptNFTokenOffer,cancelNFTokenOffers} from "../../xrpl/index.js";




/**
 * @function offerSelector
 * @description
 * Filters and displays the offers based on their type (sell, buy, invalid) and direction (Incoming,
 * Outgoing). Allows the user to manage or cancel the offers.
 * 
 * @param {string} networkRPC - The network RPC.
 * @param {object} account - The account object containing the account address.
 * @param {Array} offers - The array of offers to be managed.
 * @param {string} direction - The direction of the offers (Incoming or Outgoing).
 * @returns {Promise<Object>} - An object containing the result, message, and additional data based on the user's choice.
 * @throws {string} - Error message if there is a problem selecting an offer.
 */
export const offerSelector = async (networkRPC,account,offers, direction) =>{
    try
    {
        printBanner()
        if(offers.length===0) return {result:'success',message:`There are no ${direction} offers to manage.`}
        let sellOffers = offers.filter(offer=>offer.OfferType==='sell')
        let buyOffers = offers.filter(offer=>offer.OfferType==='buy')
        let invalidOffers = offers.filter(offer=>offer.OfferType==='invalid' )
        
        infoMessage(`${direction} Sell offers: ${sellOffers.length}`)
        infoMessage(`${direction} Buy offers: ${buyOffers.length}`)
        infoMessage(`Invalid offers: ${invalidOffers.length}`)
        console.log()
        sellOffers.length>0 && direction===`Incoming`?warningMessage(`Incoming Sell offers are for NFTs that you do not own. Acceptance would result in you purchasing the NFT.`):null
        buyOffers.length>0&& direction===`Incoming`?warningMessage(`Incoming Buy offers are for NFTs that you own. Acceptance would result in the sale of your NFT.`):null

        sellOffers.length>0 && direction===`Outgoing`?warningMessage(`Outgoing Sell offers are for NFTs that you own. Acceptance would result in the sale of your NFT.`):null
        buyOffers.length>0&& direction===`Outgoing`?warningMessage(`Outgoing Buy offers are for NFTs that you do not. Their Acceptance would result in you purchasing their NFT.`):null
        invalidOffers.length>0?warningMessage(`Invalid Offers are ones that have expired, are no longer owned by the original owner or have been burned.`):null
        let options = []
        if(sellOffers.length>0) options.push(`Manage sell offers`)
        if(buyOffers.length>0) options.push(`Manage buy offers`)
        if(invalidOffers.length>0) options.push(`Cancel all invalid offers`)
        options.push('Cancel')
        let whichOfferType = await askWhichFromList(`What type of offer would you like to manage?`,options)
        if(whichOfferType==='Cancel') return {result:'warn',message:`User cancelled handling incoming offers.`}
        else if (whichOfferType==='Cancel all invalid offers')
        {
            let filteredOffers = offers.filter(offer=>offer.OfferType==='invalid')
            let offerIDs = filteredOffers.map(offer=>offer.OfferID)
            let txOptions ={verify:true,verbose:true,askConfirmation:true}
            let cancelResult = await cancelNFTokenOffers(networkRPC,account,offerIDs,txOptions)
            if (cancelResult.result!=='success') return cancelResult
            else return {result:'success',message:`User cancelled all invalid offers.`,invalidOffers:filteredOffers}
        } 
        else
        {
             //TODO: ADD OPTION TO VIEW BY NFTokenID

            //For now just view by offerID
            let offerTypeOfferIDs = whichOfferType==='Manage buy offers'?buyOffers:sellOffers
            let options = offerTypeOfferIDs.map(offer=>offer.OfferID)
            options.push('Cancel')
            let selectedOfferID = await askWhichFromList(`Which offer would you like to manage?`,options)
            if(selectedOfferID==='Cancel') return {result:'warn',message:`User cancelled handling incoming offers.`}
            else return {result:'success',message:`User selected offer with ID: ${selectedOfferID}.`,offer:offerTypeOfferIDs.find(offer=>offer.OfferID===selectedOfferID)}
        }
    }
    catch(err)
    {
        console.log(`There was a problem selecting an offer: ${err}`)
    }

}

/**
 * @function handleOffer
 * @description
 * Handles the selected offer by allowing the user to view all offers, accept, cancel, or reject the
 * offer. Also allows viewing sell and buy offers separately.
 * 
 * @param {string} networkRPC - The network RPC.
 * @param {object} account - The account object containing the account address.
 * @param {object} offerToManage - The offer object to be managed.
 * @param {string} direction - The direction of the offer (Incoming or Outgoing).
 * @returns {Promise<Object>} - An object containing the result, message, and additional data based on the user's choice.
 * @throws {string} - Error message if there is a problem handling the incoming offer.
 */
export const  handleOffer = async (networkRPC,account,offerToManage,direction) =>{
    try
    {
        printBanner()
        infoMessage(`NFTokenID: ${offerToManage.NFTokenID}`)
        
        console.log()
        // console.log(`offerToManage: `,offerToManage)
        let offer = offerToManage.OfferType==='sell'?offerToManage.offers.sellOffers.find(o=>{return o.nft_offer_index===offerToManage.OfferID}):offerToManage.offers.buyOffers.find(o=>{return o.nft_offer_index===offerToManage.OfferID})
        // console.log('offer: ',offer)
        
        printNFTOffer(offer)
        console.log(`--------------------------------------------------------------------------------`)

        //TODO: ADD NFT VIEWING
        let options = ['View All Offers']
        direction === 'Incoming'?options.push(`Accept Offer`):options.push(`Cancel Offer`)
        offerToManage.Destination===account.address && direction==='Incoming'?options.push('Reject Offer'):null
        options.push('View Buy Offers')
        options.push('View Sell Offers')
        options.push('Cancel')
        let txOptions = {verbose:true,verify:true,askConfirmation:true,txMessage:''}
        let manageType = await askWhichFromList('What would you like to do?',options)
        switch(manageType)
        {
            case 'View All Offers':
                printNFTOffers(offerToManage.offers,'all')
                await pressAnyKey()
                return handleOffer(networkRPC,account,offerToManage,direction)

            case 'Accept Offer':
                let acceptNFTokenOfferOptions = {mode:'direct'}
                offerToManage.OfferType ==='buy'?acceptNFTokenOfferOptions.buyOffer = offerToManage.OfferID:acceptNFTokenOfferOptions.sellOffer = offerToManage.OfferID
                let acceptOfferResponse = await acceptNFTokenOffer(networkRPC,account,acceptNFTokenOfferOptions,txOptions)
                if(acceptOfferResponse.result!=='success') return acceptOfferResponse
                else return {...acceptOfferResponse,removeNFT:offerToManage.NFTokenID}

            case 'Cancel Offer':
                let cancelOfferResponse = await cancelNFTokenOffers(networkRPC,account,[offerToManage.OfferID],txOptions)
                if(cancelOfferResponse.result!=='success') return cancelOfferResponse
                else return {...cancelOfferResponse,removeOffer:offerToManage.OfferID}

            case 'Reject Offer':
                let rejectOfferResponse = await cancelNFTokenOffers(networkRPC,account,[offerToManage.OfferID],txOptions)
                if(rejectOfferResponse.result!=='success') return rejectOfferResponse
                else return {...rejectOfferResponse,removeOffer:offerToManage.OfferID}

            case 'View Sell Offers':
                printNFTOffers(offerToManage.offers,'sell')
                await pressAnyKey()
                return handleOffer(networkRPC,account,offerToManage,direction)

            case 'View Buy Offers':
                printNFTOffers(offerToManage.offers,'buy')
                await pressAnyKey()
                return handleOffer(networkRPC,account,offerToManage,direction)

            case 'Cancel':
                return {result:'success',message:'Offer management cancelled.'}
            default:
                return {result:'warn',message:'Something went wrong while handling the offer.'}
        }
    }
    catch(err)
    {
        console.log(`There was a problem handling the incoming offer: ${err}`)
    }
}
