import { infoMessage,successMessage,errorMessage } from "../../utils/index.js"
import xrpl from 'xrpl'

 /**
 * @function printNFTOffer
 * @description
 * Prints the details of a single NFT offer in a formatted manner. The function takes in an offer object
 * and logs the offer details such as offer ID, type, owner, expiration, destination, and amount.
 * 
 * @param {Object} offer - The NFT offer object containing the details of the offer.
 */
export const printNFTOffer = (offer)=>
{
    let printAmount = ``
    if(typeof offer.Amount === 'object')
    {
        printAmount = `${offer.amount.value} $${offer.Amount.currency.length>3?xrpl.convertHexToString(offer.amount.currency):offer.amount.currency} issued by ${offer.amount.issuer}`
    }
    else printAmount = `${xrpl.dropsToXrp(Number(offer.amount))} $XRP`

    console.log(`--------------------------------------------------------------------------------`)
    infoMessage(`OFFER ID: ${offer.nft_offer_index}`)
    infoMessage(`OFFER TYPE: ${offer.flags===0?'buy':'sell'}`)
    infoMessage(`OFFER OWNER: ${offer.owner}`)
    infoMessage(`OFFER EXPIRATION: ${offer.expiration}`)
    infoMessage(`OFFER DESTINATION: ${offer.destination}`)
    infoMessage(`OFFER AMOUNT: ${printAmount}`)
    
}

/**
 * @function printNFTOffers
 * @description
 * Prints the details of multiple NFT offers based on the specified type (buy, sell, or all). The function
 * takes in an offers object containing buyOffers and sellOffers arrays, and a type string. It logs the offer
 * details in
 * a formatted manner, separating buy and sell offers if the type is 'all'.
 * 
 * @param {Object} offers - The object containing the buyOffers and sellOffers arrays.
 * @param {string} type - The type of offers to print ('buy', 'sell', or 'all').
 */
export const printNFTOffers = (offers,type)=>{
    let {buyOffers,sellOffers} = offers
    if(type ==='all')
    {
        if(buyOffers.length>0)
        {
            successMessage(`There are ${buyOffers.length} buy offers for this NFT.`)
            console.log()
            successMessage('BUY OFFERS: ')
            buyOffers.forEach((offer)=>{  printNFTOffer(offer) })
            console.log(`--------------------------------------------------------------------------------`)
            console.log()
        }else errorMessage('There are no buy offers for this NFT.')
      
        if(sellOffers.length>0)
        {
            successMessage(`There are ${sellOffers.length} sell offers for this NFT.`)
            successMessage('SELL OFFERS: ')
            sellOffers.forEach((offer)=>{  printNFTOffer(offer) })
            console.log(`--------------------------------------------------------------------------------`)
        }else errorMessage('There are no sell offers for this NFT.')
    }
    else
    {
        let offers = type==='buy'?buyOffers:sellOffers
        if(offers.length>0)
        {
            successMessage(`There are ${offers.length} ${type} offers for this NFT.`)
            console.log()
            successMessage(`${type.toUpperCase()} OFFERS: `)
            offers.forEach((offer)=>{  printNFTOffer(offer) })
            console.log(`--------------------------------------------------------------------------------`)
        }else errorMessage(`There are no ${type} offers for this NFT.`)
      
    }
}
