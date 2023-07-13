import { configHandler } from "../../config/configHandler.js"
import { printResponse, successMessage, infoMessage, warningMessage, } from "../../utils/index.js"
import {createNFTokenOffer } from "../../xrpl/index.js"
import { isCurrencyPaymentValid } from "./isCurrencyPaymentValid.js"

/**
 * @function handleCreateOffer
 * @description
 * Handles the creation of an offer for an NFT based on the distribution type specified in the current
 * configuration. It creates an NFT offer on the XRPL and updates the NFT status accordingly.
 * 
 * @param {object} currentConfig - The current configuration object.
 * @param {object} wallet - The wallet object containing the user's credentials.
 * @param {object} nft - The NFT object for which the offer is being created.
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the create NFTokenOffer process.
 * @throws {string} - A string describing the error that occurred during the offer creation process.
 */
export const handleCreateOffer = async(currentConfig,wallet, nft, ) =>{
    try
    {
        let networkRPC= currentConfig.NFT.networkRPC
        console.log()
        infoMessage(`Creating offer for NFT ${nft.nftokenID}...`)
        let txOptions = {verify:false,verbose:false,txMessage:null,askConfirmation:false}
        let distributionType = currentConfig.NFT_DISTRIBUTION.distributionType
        let createOfferResult
        switch(distributionType)
        {
            case 'Simple Distribution':
                let currency = currentConfig.NFT_DISTRIBUTION.currency
                let offerAmount = currency.type==='IC'?{currency:currency.hex,issuer:currency.issuer,value:currency.amount.toString()}:currency.amount.toString()
                createOfferResult= await createNFTokenOffer(networkRPC,wallet,nft.nftokenID,offerAmount,{sale:true},txOptions)
                break;
            case 'On-Demand Distribution':
                createOfferResult = await createNFTokenOffer(networkRPC,wallet,nft.nftokenID,'0',{sale:true,destination:nft.purchase.address},txOptions)
                break;
            case 'Trustline Distribution':
                createOfferResult = {result:'warn',message:'Trustline distribution not yet implemented', hash:null, code:null, forceStatus:'pending'}
                break;
        }
        
        printResponse(createOfferResult)
        console.log()
        if(createOfferResult.result==='success') nft.status = 'offer-sent';
        else nft.status = 'failed';  
        if(createOfferResult.forceStatus!==undefined) nft.status=createOfferResult.forceStatus
        nft.offer.txHash = createOfferResult.hash
        nft.offer.destination=nft.purchase.address
        nft.offer.preliminaryTxResult=createOfferResult.code
        await configHandler.updateCurrentConfig(currentConfig)
        return createOfferResult
    }
    catch(err)
    {
        console.log('There was a problem handling the create offer: ',err)
    }
}

/**
 * @function handleIncomingPayment
 * @description
 * Handles an incoming payment for an NFT by checking if the payment is valid and new, and then attaching
 * the payment to an available NFT.
 * 
 * @param {Array} nfts - An array of NFT objects.
 * @param {object} currency - The currency object containing currency details.
 * @param {object} transaction - The transaction object containing payment details.
 * @returns {OperationResult} - An object containing the result and a message describing the incoming payment handling process.
 * @throws {string} - A string describing the error that occurred during the incoming payment handling process.
 */
export const handleIncomingPayment = async(nfts,currency,transaction)=>{
    try
    {
        console.log()
        infoMessage(`Checking if incoming payment is valid...`)
        let paymentExistsNFT = nfts.find(nft=>(nft.purchase.txHash===transaction.tx.hash))
        // console.log(paymentExistsNFT)
        if(paymentExistsNFT===undefined)
        {
            let deliveredAmount = transaction.meta.delivered_amount
            if(isCurrencyPaymentValid(currency,deliveredAmount))
            {
                successMessage(`This payment is new and valid`)
                infoMessage(`Looking for an nft to attach it to...`)
                let nft = nfts.find(nft=>(nft.status==='pending' && nft.purchase.txHash===null))
                // console.log(nft)
                if(nft!==undefined)
                {
                    nft.status = 'purchased';
                    nft.purchase.address = transaction.tx.Account
                    nft.purchase.txHash = transaction.tx.hash
                    nft.purchase.finalTxResult=transaction.meta.TransactionResult
                    nft.purchase.ledgerIndex=Number(transaction.tx.inLedger)
                    return {result:'success',message:`Successfully attached payment to nft ${nft.nftokenID}`}
                }
                else 
                {
                    //TODO: Handle this case
                    warningMessage(`There are no nfts that we can attach the payment to...`)
                    return {result:'success',message:`There are no nfts that we can attach the payment to...`}
                }
            }
            else return {result:'warn',message:`This payment is not valid`}
        }
        else return {result:'warn',message:`This payment was already handled...`}
      
    }
    catch(err){
        console.log('There was a problem handling the incoming payment: ',err)
    }
}

/**
 * @function handleCreatedOffer
 * @description
 * Handles the process of attaching an offerID to an NFT after the offer has been created on the XRPL.
 * 
 * @param {Array} nfts - An array of NFT objects.
 * @param {object} transaction - The transaction object containing offer details.
  * @returns {OperationResult} - An object containing the result and a message describing the offerID attaching process.
 * @throws {string} - A string describing the error that occurred during the offerID attachment process.
 */
export const handleCreatedOffer = async(nfts,transaction)=>{
    try
    {
        console.log()
        infoMessage(`Checking if offerID from offer has been attached yet.`)
        let nft = nfts.find(nft=>((nft.offer.txHash===transaction.tx.hash)&&nft.status==='offer-sent'))
        if(nft!==undefined)
        {
            successMessage(`OfferID from offer has not been attached yet.`)
            let affectedNodes = transaction.meta.AffectedNodes
            let offerID = affectedNodes.filter(affectedNode=>affectedNode.CreatedNode && affectedNode.CreatedNode.LedgerEntryType === 'NFTokenOffer')[0].CreatedNode.LedgerIndex
            nft.status = 'offer-created';
            nft.offer.offerID=offerID
            nft.offer.finalTxResult=transaction.meta.TransactionResult
            nft.offer.ledgerIndex = Number(transaction.tx.inLedger)
            return {result:'success',message:`Successfully attached offerID to nft ${nft.nftokenID}`}
            // if(Number(offer.tx.inLedger)>newestLedgerFound) newestLedgerFound=Number(offer.tx.inLedger)
        }
        else return {result:'warn',message:`This offer was already handled...`}
    }
    catch(err){
        console.log('There was a problem handling the incoming payment: ',err)
    }
}

/**
 * @function handleCancelledOffer
 * @description
 * Handles the process of resetting an NFT's offer after the offer has been cancelled on the XRPL.
 * 
 * @param {Array} nfts - An array of NFT objects.
 * @param {object} transaction - The transaction object containing offer cancellation details.
 * @returns {OperationResult} - An object containing the result and a message describing the offer cancellation handling process.
 * @throws {string} - A string describing the error that occurred during the offer cancellation handling process.
 */
export const handleCancelledOffer = async(nfts,transaction)=>{
    try{
        /*
            TODO: IF Offer was cancelled remove it from the NFT
            1) Find the NFT that has the offerID
            2) Determine the reason it was cancelled (expired, rejected, we cancelled it)
            2) Reset the offer portion of the NFT
            3) Set the status to 'pending'/'purchased'
        */
        return {result:'success',message:`Successfully Cancelled offer to nft ${nft.nftokenID}`}
    }
    catch(err){
        console.log('There was a problem handling the incoming payment: ',err)
    }
}

/**
 * @function handleAcceptedOffer
 * @description
 * Handles the process of attaching an accepted offer to an NFT after the offer has been accepted on the XRPL.
 * 
 * @param {Array} nfts - An array of NFT objects.
 * @param {object} transaction - The transaction object containing accepted offer details.
 * @returns {OperationResult} - An object containing the result and a message describing the offer attaching process.
 * @throws {string} - A string describing the error that occurred during the accepted offer attachment process.
 */
export const handleAcceptedOffer = async(nfts,transaction)=>{
    try
    {
        console.log()
        infoMessage(`Checking if accepted offer has been attached yet.`)
        let nft = nfts.find(nft=>((nft.offer.offerID===transaction.tx.NFTokenSellOffer)&&nft.status==='offer-created'))
        if(nft!==undefined)
        {
            successMessage(`Attaching new accepted offer...`)
            nft.status = 'offer-accepted';
            nft.acceptOffer.txHash=transaction.tx.hash
            nft.acceptOffer.finalTxResult=transaction.meta.TransactionResult
            nft.acceptOffer.ledgerIndex = Number(transaction.tx.inLedger)
            nft.acceptOffer.address = transaction.tx.Account
            return {result:'success',message:`Successfully attached accept offer tx to nft ${nft.nftokenID}`}
        }
        else return {result:'warn',message:`This offer was already handled or is a part of a different distribution.`}
    }
    catch(err){
        console.log('There was a problem handling the incoming payment: ',err)
    }
}