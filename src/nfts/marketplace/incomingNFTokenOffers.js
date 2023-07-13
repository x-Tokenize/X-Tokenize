import { createSpinner, askWhichFromList, printResponse, warningMessage, pressAnyKey} from "../../utils/index.js";
import {  getAccountNFTs,getLatestLedger,getAccountTransactions,getNFTokenOffers} from "../../xrpl/index.js";
import { offerSelector,handleOffer } from "./offerHandler.js";


/**
 * @function getAcceptableIncomingNFTokenOffers
 * @description
 * Retrieves a list of acceptable incoming NFT offers for a given account. Filters out offers made by the
 * account itself and verifies the existence of historical offers.
 * 
 * @param {string} networkRPC - The network RPC URL.
 * @param {string} address - The account address to retrieve offers for.
 * @param {number} ledgerIndexMin - The minimum ledger index to search for offers.
 * @param {number} ledgerIndexMax - The maximum ledger index to search for offers.
 * @returns {Promise<Object>} - An object containing the result, message, and an array of verified offers.
 * @throws {string} - Error message if there is a problem getting acceptable NFT offers.
 */
export const getAcceptableIncomingNFTokenOffers = async(networkRPC,address,ledgerIndexMin,ledgerIndexMax)=>{
    try
    {
        let verifiedOffers = []
        let spinner = await createSpinner(`Getting Account NFTs...`)
        let accountNFTsResponse = await getAccountNFTs(networkRPC,address)
        spinner.stop()
        if(accountNFTsResponse.result!=='success') return accountNFTsResponse
        else
        {
            let {nfts} = accountNFTsResponse
            if(nfts.length>0)
            {
                spinner.message(`Getting incoming offers for ${nfts.length} NFTs... This could take a while.`)
                spinner.start()
                for await(let nft of nfts)
                {
                    let offersResponse = await getNFTokenOffers(networkRPC,nft.NFTokenID)
                    if(offersResponse.result ==='success')
                    {
                        let {buyOffers,sellOffers} = offersResponse
                        if(buyOffers.length>0)
                        {
                            let validOffers = buyOffers.filter(offer=>offer.Owner !==address)
                            if(validOffers.length>0){
                                validOffers.forEach((offer)=>{
                                    verifiedOffers.push(
                                        {
                                            NFTokenID:nft.NFTokenID,
                                            OfferType:'buy',
                                            OfferID:offer.nft_offer_index,
                                            Account:offer.owner,
                                            Amount:offer.amount,
                                            Destination:offer.destination,
                                            Expiration:offer.expiration,
                                            offers:{buyOffers:buyOffers,sellOffers:sellOffers}
                                        }
                                    )
                                })
                            }
                        }
                    }
                }
            }
        }
        spinner.stop()
        spinner.message(`Geting account transactions from ${ledgerIndexMin} to ${ledgerIndexMax}... This could take a while.`)
        spinner.start()
        let accountTxOptions = {ledger_index_min:ledgerIndexMin,ledger_index_max:ledgerIndexMax,forward:true}
        let accountTxsResponse = await getAccountTransactions(networkRPC,address,accountTxOptions)
        spinner.stop()
       

        if(accountTxsResponse.result!=='success') return accountTxsResponse
        else
        {
           let {nfts} = accountNFTsResponse
           let {transactions} = accountTxsResponse
           let historicalOfferTransactions = transactions.filter((tx)=>{return tx.tx.TransactionType==='NFTokenCreateOffer' && tx.tx.Account!== address && tx.meta.TransactionResult==='tesSUCCESS'})
           let historicalIncomingOffers = historicalOfferTransactions.map((tx)=>{
            let offerID = tx.meta.AffectedNodes.find((an)=>{return an.CreatedNode && an.CreatedNode.LedgerEntryType==='NFTokenOffer'}).CreatedNode.LedgerIndex
            let purchaseOrSale = tx.tx.NFTokenID in nfts ? 'owned':'sell'
            return {
                        NFTokenID:tx.tx.NFTokenID,
                        OfferType:purchaseOrSale,
                        OfferID:offerID,
                        Account:tx.tx.Account,
                        Amount:tx.tx.Amount,
                        Destination:tx.tx.Destination,
                        Expiration:tx.tx.Expiration,
                    }
            })
            let incomingSellOffers = historicalIncomingOffers.filter((offer)=>{return offer.OfferType==='sell'})
            for await(let offer of incomingSellOffers)
            {
                spinner.message(`Getting offers for ${offer.NFTokenID}...`)
                spinner.start()
                let nftOffersResponse = await getNFTokenOffers(networkRPC,offer.NFTokenID)
                spinner.stop()
                if(nftOffersResponse.result==='success')
                {
                    // let offers = offer.OfferType==='sell'?nftOffersResponse.sellOffers:nftOffersResponse.buyOffers
                    let sellOffers = nftOffersResponse.sellOffers
                    let offerExists = sellOffers.find(so=>{return so.nft_offer_index===offer.OfferID})
                    if(offerExists)
                    {
                        offer.offers = {buyOffers:nftOffersResponse.buyOffers,sellOffers:nftOffersResponse.sellOffers}
                        verifiedOffers.push(offer)
                    }
                }
            }
            // console.log(`ALL VERIFIED:`,verifiedOffers)
            // await pressAnyKey()
            return {result:'success',message:`Found ${verifiedOffers.length} acceptable offers.`, offers:verifiedOffers}

        }
    }
    catch(err)
    {
        console.log(`There was a problem getting acceptable NFT offers: ${err}`)
    }
}


/**
 * @function manageIncomingOffers
 * @description
 * Manages incoming NFT offers by handling each offer and updating the offers list accordingly.
 * 
 * @param {string} networkRPC - The network RPC URL.
 * @param {Object} account - The account object containing the account address and other details.
 * @param {Array} offers - The array of offers to manage.
 * @returns {OperationResult} - An object containing the result and a message describing the incoming offer managment result.
 * @throws {string} - Error message if there is a problem managing an offer.
 */
export const manageIncomingOffers = async (networkRPC,account,offers) => {
    try
    {
        let offerToManageResult=  await offerSelector(networkRPC,account,offers,'Incoming')
        if(offerToManageResult.result!=='success') return offerToManageResult
        else
        {
            let handledResponse = await handleOffer(networkRPC,account,offerToManageResult.offer,'Incoming')
            printResponse(handledResponse)
            if(handledResponse.result!=='success') return handledResponse
            else
            {
                if(handledResponse.removeOffer)
                {
                    let index = offers.findIndex(o=>o.OfferID===handledResponse.removeOffer)
                    index!== -1? offers.splice(index,1):null
                    if(offers.length===0) return {result:'success',message:'All offers have been handled.'}
                    else return await manageIncomingOffers(networkRPC,account,offers)
                }
                else if(handledResponse.removeNFT)
                {
                    let filteredOffers = offers.filter(o=>o.NFTokenID!==handledResponse.removeNFT)
                    offers = filteredOffers
                    if(offers.length===0) return {result:'success',message:'All offers have been handled.'}
                    else return await manageIncomingOffers(networkRPC,account,offers)
                }
                else 
                {
                    console.log(`Elsed: ${JSON.stringify(handledResponse)}`)
                    return await manageIncomingOffers(networkRPC,account,offers)

                }
            }
        }
    }
    catch(err)
    {
        console.log('There was a problem managing an offer')
    }
}


/**
 * @function getIncomingOffers
 * @description
 * Retrieves incoming NFT offers for a given account within a specified time frame.
 * 
 * @param {string} networkRPC - The network RPC URL.
 * @param {Object} account - The account object containing the account address and other details.
 * @returns {Promise<Object>} - An object containing the result and either the offers array or a message.
 * @throws {string} - Error message if there is a problem getting incoming offers.
 */
export const getIncomingOffers = async (networkRPC,account) =>{
    try{
        let latestLedgerResponse = await getLatestLedger(networkRPC)
        if(latestLedgerResponse.result!=='success') return latestLedgerResponse
        else
        {
            let latestLedger = Number(latestLedgerResponse.ledger.ledger_index)
            const LEDGER_TIME = 3.5 // approximation of ledger time in seconds
            const timeFrames = 
            {
                day:latestLedger-Math.floor((60*60*24/LEDGER_TIME)),
                week:latestLedger-Math.floor((60*60*24*7/LEDGER_TIME)),
                month:latestLedger-Math.floor((60*60*24*30/LEDGER_TIME)),
                year:latestLedger-Math.floor((60*60*24*365/LEDGER_TIME)),
                all:undefined,
                Cancel:'Cancel'
            }
            warningMessage(`Selecting 'all' could take a while if you have a lot of NFT transactions.`)
            let howFarBack = await askWhichFromList(`Approximately how far back would you like to look for NFT offers?`,Object.keys(timeFrames))
            if(howFarBack === 'Cancel') return {result:'warn',message:`User cancelled NFT offer handling.`}
            else
            {
                let ledger_index_min= timeFrames[howFarBack]
                let ledger_index_max = latestLedger
                return await getAcceptableIncomingNFTokenOffers(networkRPC,account.address,ledger_index_min,ledger_index_max)
            }
        }
    }
    catch(err)
    {
        console.log(`There was a problem getting incoming offers: ${err}`)
    }

}


/**
 * @function getAndHandleIncomingOffers
 * @description
 * Retrieves and manages incoming NFT offers for a given account.
 * 
 * @param {string} networkRPC - The network RPC URL.
 * @param {Object} account - The account object containing the account address and other details.
 * @returns {OperationResult} - An object containing the result and a message describing the result of getting and handling the incoming offers.
 * @throws {string} - Error message if there is a problem managing incoming NFT offers.
 */
export const getAndHandleIncomingOffers= async (networkRPC,account)=>{
    try
    {
        let acceptableOffersResponse = await getIncomingOffers(networkRPC,account)
        if(acceptableOffersResponse.result!=='success') return acceptableOffersResponse
        else
        {
            let {offers} = acceptableOffersResponse
            if(offers.length===0) return {result:'warn',message:`There are no acceptable NFT offers.`}
            else return await manageIncomingOffers(networkRPC,account,offers)
        }
    }
    catch(err)
    {
        console.log(`There was a problem managing incoming NFT offers: ${err}`)
    }
}