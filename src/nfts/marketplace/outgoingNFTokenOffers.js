import { createSpinner, pressAnyKey, printResponse, } from "../../utils/index.js";
import {  getAccountNFTs,getNFTokenOffers,getAccountObjects,getAccountTransactions} from "../../xrpl/index.js";
import { handleOffer, offerSelector } from "./offerHandler.js";

/**
 * @function manageOutgoingOffers
 * @description
 * Manages outgoing NFT offers by handling each offer and updating the offers list accordingly.
 * 
 * @param {string} networkRPC - The network RPC URL.
 * @param {Object} account - The account object containing the account address and other details.
 * @param {Array} offers - The array of offers to manage.
 * @returns {Promise<Object>} - An object containing the result and message.
 * @throws {string} - Error message if there is a problem managing an offer.
 */
export const manageOutgoingOffers = async(networkRPC,account,offers)=>{
    try
    {
        let offerToManageResult=  await offerSelector(networkRPC,account,offers,'Outgoing')
        if(offerToManageResult.result!=='success') return offerToManageResult
        if(offerToManageResult.invalidOffers)
        {
            let filteredOffers = offers.filter(o=>offerToManageResult.invalidOffers.includes(o.OfferID))
            offers = filteredOffers
            if(offers.length===0) return {result:'success',message:'All offers have been handled.'}
            else return await manageOutgoingOffers(networkRPC,account,offers)
        }
        else
        {
            let handledResponse = await handleOffer(networkRPC,account,offerToManageResult.offer,'Outgoing')
            printResponse(handledResponse)
            if(handledResponse.result!=='success') return handledResponse
            else
            {
                if(handledResponse.removeOffer)
                {
                    let index = offers.findIndex(o=>o.OfferID===handledResponse.removeOffer)
                    index!== -1? offers.splice(index,1):null
                    if(offers.length===0) return {result:'success',message:'All offers have been handled.'}
                    else return await manageOutgoingOffers(networkRPC,account,offers)
                }
                else if(handledResponse.removeNFT)
                {
                    let filteredOffers = offers.filter(o=>o.NFTokenID!==handledResponse.removeNFT)
                    offers = filteredOffers
                    if(offers.length===0) return {result:'success',message:'All offers have been handled.'}
                    else return await manageOutgoingOffers(networkRPC,account,offers)
                }
                
                else 
                {
                    console.log(`Elsed: ${handledResponse}`)
                    return await manageOutgoingOffers(networkRPC,account,offers)
                }
            }
        }
        
    }
    catch(err)
    {
        console.log(`There was a problem managing outgoing offers: ${err}`)
    }
}

/**
 * @function getOutgoingOffers
 * @description
 * Retrieves outgoing NFT offers for a given account by checking the offers.
 * 
 * @param {string} networkRPC - The network RPC URL.
 * @param {Object} account - The account object containing the account address and other details.
 * @returns {Promise<Object>} - An object containing the result and either the offers array or a message.
 * @throws {string} - Error message if there is a problem getting incoming offers.
 */

export const getOutgoingOffers = async(networkRPC,account)=>{
    try 
    {
        let spinner = await createSpinner(`Getting Account objects... This could take a while.`)
        let accountObjectsResponse = await getAccountObjects(networkRPC,account.address)
        spinner.stop()
        if(accountObjectsResponse.result!=='success') return accountObjectsResponse
        else
        {
            let {objects} = accountObjectsResponse
            let offers = objects.filter(o=>o.LedgerEntryType==='NFTokenOffer')
            if(offers.length===0) return {result:'warn',message:`There are no outgoing NFT offers.`}
            else
            {
                let formattedSellOffers,formattedBuyOffers = []
                let filteredSellOffers= offers.filter(o=>o.Flags===1)
                if(filteredSellOffers.length===0) formattedSellOffers = []
                else formattedSellOffers = filteredSellOffers.map(o=>{return {NFTokenID:o.NFTokenID,OfferType:'sell',OfferID:o.index,Account:o.Owner,Amount:o.Amount,Destination:o.Destination,Expiration:o.Expiration}})
                let filteredBuyOffers= offers.filter(o=>o.Flags===0)
                if(filteredBuyOffers.length===0) formattedBuyOffers = []
                else formattedBuyOffers = filteredBuyOffers.map(o=>{return {NFTokenID:o.NFTokenID,OfferType:'buy',OfferID:o.index,Account:o.Owner,Amount:o.Amount,Destination:o.Destination,Expiration:o.Expiration}})

                let allOffers = [...formattedSellOffers,...formattedBuyOffers]
                let verifiedOffers = []
                let accountsChecked = new Set()
                let accountNFTs = {}
                for await(let offer of allOffers)
                {
                    console.log(offer)
                    let accountNFTsResponse =accountsChecked.has(offer.Account)?{result:'success',nfts:accountNFTs[offer.Account]}:await getAccountNFTs(networkRPC,offer.Account)
                    if(accountNFTsResponse.result ==='success')
                    {
                        accountsChecked.add(offer.Account)
                        accountNFTs[offer.Account] = accountNFTsResponse.nfts
                        spinner.message(`Getting Offers for NFTokenID: ${offer.NFTokenID}`)
                        spinner.start()
                        let offersResponse = await getNFTokenOffers(networkRPC,offer.NFTokenID)
                        spinner.stop()
                        if(offersResponse.result ==='success')
                        {
                            let {buyOffers,sellOffers} = offersResponse
                            offer.offers= {buyOffers:buyOffers,sellOffers:sellOffers}
                            verifiedOffers.push(offer)
                        }
                    }
                }
                return {result:'success',offers:allOffers}
            }
        }
    }
    catch (err) 
    {
        console.log(`There was a problem getting outgoing offers: ${err}`)   
    }
}



/**
 * @function getAndHandleOutgoingOffers
 * @description
 * Retrieves and manages outgoing NFT offers for a given account.
 * 
 * @param {string} networkRPC - The network RPC URL.
 * @param {Object} account - The account object containing the account address and other details.
 * @returns {Promise<Object>} - An object containing the result and a message.
 * @throws {string} - Error message if there is a problem managing incoming NFT offers.
 */
export const getAndHandleOutgoingOffers = async (networkRPC,account)=>{
    try
    {
        let getOutgoingOffersResponse = await getOutgoingOffers(networkRPC,account)
        if(getOutgoingOffersResponse.result!=='success') return getOutgoingOffersResponse
        else return await manageOutgoingOffers(networkRPC,account,getOutgoingOffersResponse.offers)
      
    }
    catch(err)
    {
        console.log(`There was a problem handling outgoing offers: ${err}`)
    }
}



/*


export const getOutgoingOffers5 = async(networkRPC,account)=>{
    try
    {
        let spinner = await createSpinner(`Getting Account objects... This could take a while.`)
        let accountObjectsResponse = await getAccountObjects(networkRPC,account.address)
        spinner.stop()
        if(accountObjectsResponse.result!=='success') return accountObjectsResponse
        else
        {
            let {objects} = accountObjectsResponse
            let offers = objects.filter(o=>o.LedgerEntryType==='NFTokenOffer')
            if(offers.length===0) return {result:'warn',message:`There are no outgoing NFT offers.`}
            else
            {
                let formattedSellOffers,formattedBuyOffers

                let filteredSellOffers= offers.filter(o=>o.Flags===1)
                if(filteredSellOffers.length===0) formattedSellOffers = []
                else formattedSellOffers = filteredSellOffers.map(o=>{return {NFTokenID:o.NFTokenID,OfferType:'sell',OfferID:o.index,Account:o.Owner,Amount:o.Amount,Destination:o.Destination,Expiration:o.Expiration}})
                //  console.log(filteredSellOffers)
                let filteredBuyOffers= offers.filter(o=>o.Flags===0)
                if(filteredBuyOffers.length===0) formattedBuyOffers = []
                else 
                {
                      console.log(filteredBuyOffers)
                    let earliestLedgerSequeneceInBuyOffers = Math.min(...filteredBuyOffers.map(o=>o.PreviousTxnLgrSeq))-1
                    let accountTxOptions = {ledger_index_min:earliestLedgerSequeneceInBuyOffers,forward:true}
                    let accountTxResponse = await getAccountTransactions(networkRPC,account.address,accountTxOptions)
                    if(accountTxResponse.result!=='success') formattedBuyOffers = []
                    else
                    {
                        let {transactions} = accountTxResponse
                        let nftokenBuyOfferTxs = transactions.filter((transaction)=>transaction.tx.TransactionType==='NFTokenCreateOffer'&&transaction.tx.Flags===0 && transaction.meta.TransactionResult==='tesSUCCESS' && transaction.tx.Account===account.address)
                        nftokenBuyOfferTxs=nftokenBuyOfferTxs.map((transaction)=>{
                            let affectedNodes = transaction.meta.AffectedNodes
                            let offerID = affectedNodes.filter(affectedNode=>affectedNode.CreatedNode && affectedNode.CreatedNode.LedgerEntryType === 'NFTokenOffer')[0].CreatedNode.LedgerIndex
                           
                            return {NFTokenID:transaction.tx.NFTokenID, Owner:transaction.tx.Owner, OfferID:offerID, Amount:transaction.tx.Amount, Destination:transaction.tx.Destination, Expiration:transaction.tx.Expiration}
                            })
                        if(nftokenBuyOfferTxs.length===0) formattedBuyOffers = []
                        else
                        {
                           console.log(nftokenBuyOfferTxs)
                            formattedBuyOffers = filteredBuyOffers.map((o)=>{
                                let ownerTX = nftokenBuyOfferTxs.find(offerTx=>nft.OfferID===o.index)
                                console.log(`OWNER TX: ${ownerTX}`)
                               return{NFTokenID:o.NFTokenID,OfferType:'buy',OfferID:o.index, Account:o.Owner,Amount:o.Amount,Destination:o.Destination?o.Destination:null,Expiration:o.Expiration?o.Expiration:null}
                            })
                            //console.log(nftokenBuyOfferTxs)
                            //let nftokenIDOwners = nftokenBuyOfferTxs.map(transaction=>{return {NFTokenID:transaction.tx.NFTokenID, Owner:transaction.tx.Owner}})
                            // console.log(nftokenIDOwners)
                            //console.log(filteredBuyOffers)
                            //formattedBuyOffers = filteredBuyOffers.map((o)=>{
                               // let owner = 
                                //console.log(nftokenIDOwners)
                                //console.log(o)
                                //console.log('here')
                               // let ownerFound = nftokenIDOwners.find(nft=>nft.NFTokenID===o.NFTokenID)
                               
                                //console.log(owner)
                               // console.log(o)
                               // return {NFTokenID:o.NFTokenID,OfferType:'buy',OfferID:o.index,Account:owner,Amount:o.TakerPays,Destination:o.TakerGets,Expiration:o.Expiration}
                           // })
                        }
                    }
                }
                let formattedOffers = [...formattedSellOffers,...formattedBuyOffers]
                let verifiedOffers = []
                let accountsChecked = new Set()
                let accountNFTs = {}
                // TODO: Handle Expired Offers Immediately
                for await(let offer of formattedOffers)
                {
                    console.log(offer)
                    let accountNFTsResponse //=accountsChecked.has(offer.Account)?{result:'success',nfts:accountNFTs[offer.Account]}:await getAccountNFTs(networkRPC,offer.Account)
                    if(offer.offerType ==='buy') 
                    if(accountNFTsResponse.result ==='success')
                    {
                        accountsChecked.add(offer.Account)
                        accountNFTs[offer.Account] = accountNFTsResponse.nfts
                        let nftExists = accountNFTsResponse.nfts.find(nft=>nft.NFTokenID===offer.NFTokenID)
                        if(!nftExists) {offer.OfferType = 'invalid'}
                        spinner.message(`Getting Offers for NFTokenID: ${offer.NFTokenID}`)
                        spinner.start()
                        let offersResponse = await getNFTokenOffers(networkRPC,offer.NFTokenID)
                        spinner.stop()
                        if(offersResponse.result ==='success')
                        {
                            let {buyOffers,sellOffers} = offersResponse
                            offer.offers= {buyOffers:buyOffers,sellOffers:sellOffers}
                            verifiedOffers.push(offer)
                        }
                    }
                }
                console.log(verifiedOffers)
                await pressAnyKey()
                return {result:'success',offers:verifiedOffers}
            }
        }
    }
    catch(err)
    {
        console.log(`There was a problem getting outgoing offers: ${err}`)
    }
}

export const getOutgoingOffers2 = async(networkRPC,account)=>{
    try
    {
        let spinner = await createSpinner(`Getting Account objects... This could take a while.`)
        let accountObjectsResponse = await getAccountObjects(networkRPC,account.address)
        spinner.stop()
        if(accountObjectsResponse.result!=='success') return accountObjectsResponse
        else
        {
            let {objects} = accountObjectsResponse
            let offers = objects.filter(o=>o.LedgerEntryType==='NFTokenOffer')
            if(offers.length===0) return {result:'warn',message:`There are no outgoing NFT offers.`}
            else
            {
                let accountNFTsResponse = await getAccountNFTs(networkRPC,account.address);
                if(accountNFTsResponse.result!=='success') return accountNFTsResponse
                else  
                {
                    let {nfts} = accountNFTsResponse
                    let filteredSellOffers = offers.filter(o=>o.Flags===1)
                    let filteredBuyOffers = offers.filter(o=>o.Flags===0)
                    let formattedBuyOffers =[]
                    let formattedSellOffers = []
                    
                    
                    if(filteredBuyOffers.length>0)
                    {
                        let earliestLedgerSequeneceInBuyOffers = Math.min(...filteredBuyOffers.map(o=>o.PreviousTxnLgrSeq))-1
                        let accountTxOptions = {ledger_index_min:earliestLedgerSequeneceInBuyOffers,forward:true}
                        let accountTxResponse = await getAccountTransactions(networkRPC,account.address,accountTxOptions)
                        if(accountTxResponse.result!=='success') return accountTxResponse
                        else
                        {
                            let {transactions} = accountTxResponse
                            let nftokenBuyOfferTxs = transactions.filter((transaction)=>transaction.tx.TransactionType==='NFTokenCreateOffer'&&transaction.tx.Flags===0 && transaction.meta.TransactionResult==='tesSUCCESS' && transaction.tx.Account===account.address)
                            if(nftokenBuyOfferTxs.length===0) formattedBuyOffers = []
                            else
                            {
                                nftokenBuyOfferTxs.forEach((transaction)=>{
                                    //check if offer is in filteredBuyOffers
                                    if(filteredBuyOffers.find(o=>o.index===transaction.tx.index))
                                    {
                                        //check if we own the NFT
                                        let nftokenID = transaction.tx.NFTokenID
                                        let found = nfts.find(nft=>nft.NFTokenID===nftokenID)
                                        console.log(transaction)
                                        if(found) formattedBuyOffers.push({NFTokenID:transaction.tx.NFTokenID,OfferType:'invalid',OfferID:transaction.tx.index,Account:transaction.tx.Account,Amount:transaction.tx.Amount,Destination:transaction.tx.Destination?transaction.tx.Destination:null,Expiration:transaction.tx.Expiration})
                                        else formattedBuyOffers.push({NFTokenID:transaction.tx.NFTokenID,OfferType:'buy',Owner:transaction.tx.Owner,OfferID:transaction.tx.index,Account:transaction.tx.Account,Amount:transaction.tx.Amount,Destination:transaction.tx.Destination?transaction.tx.Destination:null,Expiration:transaction.tx.Expiration})
                                    }
                                })
                            }
                        }
                    }
                    if(filteredSellOffers.length>0)
                    {
                        filteredSellOffers.forEach((offer)=>{
                            let found = nfts.find(nft=>nft.NFTokenID===offer.NFTokenID)
                            if(!found) formattedSellOffers.push({NFTokenID:offer.NFTokenID,OfferType:'invalid',OfferID:offer.index,Account:offer.Account,Amount:offer.TakerPays,Destination:offer.TakerGets,Expiration:offer.Expiration})
                            else formattedSellOffers.push({NFTokenID:offer.NFTokenID,OfferType:'sell',OfferID:offer.index,Account:offer.Account,Amount:offer.TakerPays,Destination:offer.TakerGets,Expiration:offer.Expiration})
                        })
                    }
                    console.log(`Formated Buy Offers: \n ${JSON.stringify(formattedBuyOffers,null,2)}`)
                    console.log(`Formated Sell Offers: \n ${JSON.stringify(formattedSellOffers,null,2)}`)
                    await pressAnyKey()
                    let formattedOffers = [...formattedSellOffers,...formattedBuyOffers]
                    let verifiedOffers = []
                    let accountsChecked = new Set(account.address)
                    let accountNFTs = {[account.address]:nfts}
                    // TODO: Handle Expired Offers Immediately
                    for await(let offer of formattedOffers)
                    {
                        if(offer.OfferType==='invalid') verifiedOffers.push(offer)
                        else
                        {
                            let accountNFTsResponse =accountsChecked.has(offer.Account)?{result:'success',nfts:accountNFTs[offer.Account]}:await getAccountNFTs(networkRPC,offer.Account)
                            if(accountNFTsResponse.result !=='success') return accountNFTsResponse
                            else
                            {
                                accountsChecked.add(offer.Account)
                                if(offer.offerType ==='buy')
                                accountNFTs[offer.Account] = accountNFTsResponse.nfts
                                let nftExists = accountNFTsResponse.nfts.find(nft=>nft.NFTokenID===offer.NFTokenID)
                                if(!nftExists) {offer.OfferType = 'invalid'}
                                spinner.message(`Getting Offers for NFTokenID: ${offer.NFTokenID}`)
                                spinner.start()
                                let offersResponse = await getNFTokenOffers(networkRPC,offer.NFTokenID)
                                spinner.stop()
                                if(offersResponse.result ==='success')
                                {
                                    let {buyOffers,sellOffers} = offersResponse
                                    offer.offers= {buyOffers:buyOffers,sellOffers:sellOffers}
                                    verifiedOffers.push(offer)
                                }
                            }
                        }
                    }
                    return {result:'success',offers:verifiedOffers}
                }
            }
        }
    }
    catch(err)
    {
        console.log(`There was a problem getting the outgoing offers: `)
        console.log(err)
    }
}


export const getOutgoingOffers3 = async(networkRPC,account)=>{
    try
    {
        let spinner = await createSpinner(`Getting Account objects... This could take a while.`)
        let accountObjectsResponse = await getAccountObjects(networkRPC,account.address)
        spinner.stop()
        if(accountObjectsResponse.result!=='success') return accountObjectsResponse
        else
        {
            let {objects} = accountObjectsResponse
            let offers = objects.filter(o=>o.LedgerEntryType==='NFTokenOffer')
            if(offers.length===0) return {result:'warn',message:`There are no outgoing NFT offers.`}
            else
            {
                let earliestLedgerSequeneceInBuyOffers = Math.min(...offers.map(o=>o.PreviousTxnLgrSeq))-1
                let accountTxOptions = {ledger_index_min:earliestLedgerSequeneceInBuyOffers,forward:true}
                let accountTxResponse = await getAccountTransactions(networkRPC,account.address,accountTxOptions)
                let accountNFTsResponse = await getAccountNFTs(networkRPC,account.address)
                
                if(accountTxResponse.result!=='success' || accountNFTsResponse.result!=='success') return {result:'warn', message:'Failed to get account transactions or NFTs.'}
                else
                {
                    
                    let formattedBuyOffers =[]
                    let formattedSellOffers = []
                    let accountsChecked = new Set(account.address)
                    let accountNFTs = {[account.address]:accountNFTsResponse.nfts}
                    let txs = accountTxResponse.transactions.filter(tx=>tx.tx.TransactionType==='NFTokenCreateOffer' && tx.meta.TransactionResult==='tesSUCCESS')
                    // console.log(accountNFTs)
                    let sellOffers = offers.filter(o=>o.Flags===1)
                    let buyOffers = offers.filter(o=>o.Flags===0)
                    
                    sellOffers.forEach((offer)=>{
                        let found = accountNFTs[account.address].find(nft=>nft.NFTokenID===offer.NFTokenID)
                        if(!found) formattedSellOffers.push({NFTokenID:offer.NFTokenID,OfferType:'invalid',OfferID:offer.index,Account:account.address,Amount:offer.Amount,Destination:offer.Destination?offer.Destination:null,Expiration:offer.Expiration?offer.Expiration:null})
                        else formattedSellOffers.push({NFTokenID:offer.NFTokenID,OfferType:'sell',OfferID:offer.index,Account:account.address,Amount:offer.Amount,Destination:offer.Destination?offer.Destination:null,Expiration:offer.Expiration?offer.Expiration:null})
                    })
                    buyOffers.forEach((offer)=>{
                        let found = accountNFTs[account.address].find(nft=>nft.NFTokenID===offer.NFTokenID)
                        if(found) formattedBuyOffers.push({NFTokenID:offer.NFTokenID,OfferType:'invalid',OfferID:offer.index,Account:account.address,Amount:offer.Amount,Destination:offer.Destination?offer.Destination:null,Expiration:offer.Expiration?offer.Expiration:null})
                        else formattedBuyOffers.push({NFTokenID:offer.NFTokenID,OfferType:'buy',OfferID:offer.index,Account:account.address,Amount:offer.Amount,Destination:offer.Destination?offer.Destination:null,Expiration:offer.Expiration?offer.Expiration:null})
                    })

                    // let filteredValidBuyOffers = formattedBuyOffers.filter(offer=>offer.OfferType!=='invalid')
                    // if(filteredValidBuyOffers.length>0)
                    // {
                    //     console.log(`Getting offers for ${filteredValidBuyOffers.length} NFTokenIDs...`)
                    //     console.log(filteredValidBuyOffers)
                    //     let outgoingBuyTransactions = txs.filter((tx)=>{return tx.tx.Flags ===0})
                    //     outgoingBuyTransactions.forEach((tx=>{tx.OfferID = }))
                    //     let differentOwners = []
                    //     let differentNFTs = []
                    //     outgoingBuyTransactions.forEach((tx)=>{
                    //         if(!differentOwners.includes(tx.tx.Owner)) differentOwners.push(tx.tx.Owner)
                    //     })
                    //     for await( let owner of differentOwners)
                    //     {
                    //         let {nfts} = await getAccountNFTs(networkRPC,owner)
                    //         accountNFTs[owner] = nfts
                    //     }

                        

                        // console.log(differentNFTs)
                        // console.log(differentOwners)
                        // if(differentNFTs.)
                           // let ownerNFTs = accountNFTs[owner]?accountNFTs[owner]:await getAccountNFTs(networkRPC,owner)




                        
                       
                   // }
                    
                }

                
            }
        }

    }
    catch(err)
    {
        console.log(`There was a problem getting the outgoing offers..`)
    }
}


export const getOutgoingOffers4 = async(networkRPC,account)=>{
    try
    {
        // let spinner = await createSpinner(`Getting Account objects... This could take a while.`)
        // let accountObjectsResponse = await getAccountObjects(networkRPC,account.address)
        // spinner.stop()
        // if(accountObjectsResponse.result!=='success') return accountObjectsResponse
        // else
        // {
        //     let {objects} = accountObjectsResponse
        //     let offers = objects.filter(o=>o.LedgerEntryType==='NFTokenOffer')
        //     if(offers.length===0) return {result:'warn',message:`There are no outgoing NFT offers.`}
        //     else
        //     {
        //         let earliestLedgerSequeneceInBuyOffers = Math.min(...offers.map(o=>o.PreviousTxnLgrSeq))-1
        //         let accountTxOptions = {ledger_index_min:earliestLedgerSequeneceInBuyOffers,forward:true}
        //         let accountTxResponse = await getAccountTransactions(networkRPC,account.address,accountTxOptions)
        //         let accountNFTsResponse = await getAccountNFTs(networkRPC,account.address)
        //         if(accountTxResponse.result!=='success' || accountNFTsResponse.result!=='success') return {result:'warn', message:'Failed to get account transactions or NFTs.'}
        //         else
        //         {
        //             let formattedTxs = []
        //             let nftOfferTxs = accountTxResponse.transactions.filter(tx=>tx.tx.TransactionType==='NFTokenCreateOffer' && tx.meta.TransactionResult==='tesSUCCESS')
        //             nftOfferTxs.transactions.forEach((tx=>{
        //                 let affectedNodes = tx.meta.AffectedNodes
        //                 let offerID = affectedNodes.filter(affectedNode=>affectedNode.CreatedNode && affectedNode.CreatedNode.LedgerEntryType === 'NFTokenOffer')[0].CreatedNode.LedgerIndex
                        
        //                 let formattedTx = {
        //                     NFTokenID:tx.tx.NFTokenID,
        //                     OfferID:offerID,
        //                     OfferType:tx.tx.Flags===0?'buy':'sell',
        //                     Account:tx.tx.Account,
        //                     Amount:tx.tx.Amount,
        //                     Owner:tx.tx.Owner,
        //                     Destination:tx.tx.Destination?tx.tx.Destination:null,
        //                     Expiration:tx.tx.Expiration?tx.tx.Expiration:null,
        //                     TransactionHash:tx.tx.hash,
        //                     LedgerSequence:tx.tx.ledger_index,
        //                 }
        //                 formattedTxs.push(formattedTx)
        //             }))
                    
        //             for await (let offer of offers)
        //             {
                        //if(offer.Flag === 0) 
                        //let tx = formattedTxs.find(tx=>tx.OfferID===offer.index)
                        //if(tx)
                        //{
                            // let found = accountNFTsResponse.nfts.find(nft=>nft.NFTokenID===tx.NFTokenID)
                            // if(!found) tx.OfferType = 'invalid'

                        //}
                   // }

                    // for await (let tx of formattedTxs)
                    // {
                    //     let offer = offers.find(offer=>offer.index===tx.OfferID)
                        
                    // }
                   
                    // let formattedBuyOffers =[]
                    // let formattedSellOffers = []
                    // let accountsChecked = new Set(account.address)
                    // let accountNFTs = {[account.address]:accountNFTsResponse.nfts}
                    // let txs = accountTxResponse.transactions.filter(tx=>tx.tx.TransactionType==='NFTokenCreateOffer' && tx.meta.TransactionResult==='tesSUCCESS')
                    // // console.log(accountNFTs)
                    // let sellOffers = offers.filter(o=>o.Flags===1)
                    // let buyOffers = offers.filter(o=>o.Flags===0)
                    
                    // sellOffers.forEach((offer)=>{
                    //     let found = accountNFTs[account.address].find(nft=>nft.NFTokenID===offer.NFTokenID)
                    //     if(!found) formattedSellOffers.push({NFTokenID:offer.NFTokenID,OfferType:'invalid',OfferID:offer.index,Account:account.address,Amount:offer.Amount,Destination:offer.Destination?offer.Destination:null,Expiration:offer.Expiration?offer.Expiration:null})
                    //     else formattedSellOffers.push({NFTokenID:offer.NFTokenID,OfferType:'sell',OfferID:offer.index,Account:account.address,Amount:offer.Amount,Destination:offer.Destination?offer.Destination:null,Expiration:offer.Expiration?offer.Expiration:null})
                    // })
                    // buyOffers.forEach((offer)=>{
                    //     let found = accountNFTs[account.address].find(nft=>nft.NFTokenID===offer.NFTokenID)
                    //     if(found) formattedBuyOffers.push({NFTokenID:offer.NFTokenID,OfferType:'invalid',OfferID:offer.index,Account:account.address,Amount:offer.Amount,Destination:offer.Destination?offer.Destination:null,Expiration:offer.Expiration?offer.Expiration:null})
                    //     else formattedBuyOffers.push({NFTokenID:offer.NFTokenID,OfferType:'buy',OfferID:offer.index,Account:account.address,Amount:offer.Amount,Destination:offer.Destination?offer.Destination:null,Expiration:offer.Expiration?offer.Expiration:null})
                    // })

                    
              // }

                
          //  }
       // }

    }
    catch(err)
    {
        console.log(`There was a problem getting the outgoing offers..`)
    }
}


*/