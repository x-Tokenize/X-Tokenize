import { initializeDexConfig } from "./initializeDexConfig.js";
import { getOrderbook,getAccountOffers,transactionHandler, getXrpBalance } from "../../xrpl/index.js";
import { printBanner,askWhichFromList,askYesNo,printResponse,warningMessage, table, } from "../../utils/index.js";
import { createOfferCreateTx } from "./createOfferCreateTx.js";
import { printOrderbookAndOffers } from "./printOrderbookAndOffers.js";
import { getMaximumsForNewFundedOffer } from "./getMaximumsForNewFundedOffer.js";


/**
 * @function dex
 * @description
 * This function is the main entry point for the dex system. It initializes the dex configuration by
 * calling the initializeDexConfig function if no loadedDexConfigResult is provided. It then retrieves the orderbook and
 * account offers by calling getOrderbook and getAccountOffers functions respectively. The function prints the orderbook
 * and offers using the printOrderbookAndOffers function and calculates the spendable balances for new funded offers
 * using the getMaximumsForNewFundedOffer function. The user is then presented with a list of options to perform
 * operations such as placing or canceling offers on the XRPL DEX. Based on the user's selection, the function calls the
 * appropriate functions to handle the selected operation (e.g., createOfferCreateTx for placing offers,
 * transactionHandler for submitting transactions). The function also handles user navigation within the dex system by
 * providing options to change currency/account or go back to the previous menu.
 * 
 * @param {Object} loadedDexConfigResult - An optional object containing the loaded dex configuration. If not
 * provided, the function will call initializeDexConfig to load the configuration.
 * @returns {Promise<OperationResult>} - An object containing the result and message of the dex operation.
 * @throws {Error} - If there is a problem using the dex.
 */
export const dex = async(loadedDexConfigResult)=>{
    try
    {
        printBanner()
        let loadDexConfigResult = loadedDexConfigResult?loadedDexConfigResult:await initializeDexConfig()
        if(loadDexConfigResult.result!=='success') return {result:`warn`,message:loadDexConfigResult.message}
        else
        {
            let {networkRPC,account,currencyCode,currencyHex,issuerAddress,isInICMode} = loadDexConfigResult
            let orderbookResponse = await getOrderbook(networkRPC,currencyCode,issuerAddress)
            let accountOffersResponse= await getAccountOffers(networkRPC,account.address)
            
            if(orderbookResponse.result==='success' && accountOffersResponse.result==='success')
            {
                let {bids,asks} = orderbookResponse
                let {offers} = accountOffersResponse
                console.log()
                printOrderbookAndOffers(currencyCode,issuerAddress,bids,asks,offers)
                let spendableBalancesResponse = await getMaximumsForNewFundedOffer(networkRPC,currencyCode,currencyHex,issuerAddress,account.address,offers)
                if(spendableBalancesResponse.result==='success')
                {
                    let {maxXRP,maxIC} = spendableBalancesResponse
                    table([{[`Spendable XRP`]:maxXRP,[`Spendable ${currencyCode}`]:maxIC},])
                }
                let options = ['Place offer']
                if(offers.length>0) options.push('Cancel Offer')
                if(isInICMode) options.push('Go Back')
                else{
                    options.push(`Change Currency/Account`)
                    options.push('Go Back')
                }
                let selectedOperation = await askWhichFromList(`What would you like to do?`,options)
                let txOptions = {verify:true,verbose:true,txMessage:null,askConfirmation:true}

                switch(selectedOperation)
                {
                    case 'Place offer':
                        {
                            let offerCreateTXResponse = await createOfferCreateTx(networkRPC,currencyCode,currencyHex,issuerAddress,account.address,offers)
                            if(offerCreateTXResponse.result==='success')
                            {
                                let {offerCreateTX} = offerCreateTXResponse
                                txOptions.txMessage=`Placing the following offer: \n Taker Gets: ${JSON.stringify(offerCreateTX.TakerGets,null,2)} \n Taker Pays: ${JSON.stringify(offerCreateTX.TakerPays,null,2)}`
                                let txResult = await transactionHandler(networkRPC,offerCreateTX,account,txOptions)
                                if(txResult.result!==`success`)
                                {
                                    printResponse(txResult)
                                    if(await askYesNo(`Would you like to continue using the dex?`)) return await dex(loadDexConfigResult)
                                    else return {result:'warn',message:'The user cancelled using the dex.'}
                                }
                                else return await dex(loadDexConfigResult)
                            }
                            else
                            {
                                warningMessage('There was a problem creating the offer create transaction.')
                                if(await askYesNo(`Would you like to continue using the dex?`)) return await dex(loadDexConfigResult)
                                else return {result:'warn',message:'The user cancelled using the dex.'}
                            }
                        }
                    case 'Cancel Offer':
                        {
                            offers.sort((a,b)=>{return a.seq-b.seq})
                            let offersToCancel = offers.map((offer)=>{return offer.seq})
                            offersToCancel.push('Cancel')
                            let offerToCancel = await askWhichFromList(`Which offer would you like to cancel?`,offersToCancel)
                            if(offerToCancel==='Cancel') return await dex(loadDexConfigResult)
                            else{
                                let offerCancelTX = {
                                    TransactionType:'OfferCancel',
                                    Account:account.address,
                                    OfferSequence:offerToCancel
                                }
                                txOptions.txMessage=`Cancelling offer with sequence number ${offerToCancel}`
                                let txResult = await transactionHandler(networkRPC,offerCancelTX,account,txOptions)
                                if(txResult.result!==`success`)
                                {
                                    printResponse(txResult)
                                    if(await askYesNo(`Would you like to continue using the dex?`)) return await dex(loadDexConfigResult)
                                    else return {result:'warn',message:'The user cancelled using the dex.'}
                                }
                                else
                                {
                                    return await dex(loadDexConfigResult)
                                }
                            }
                        }
                    case 'Change Currency/Account':
                        {
                            return await dex()
                        }
                    case 'Go Back':
                        {
                            return {result:'success',message:'Successfully used the dex.'}
                        }
                }
                
            }
            else
            {
                warningMessage('There was a problem getting the orderbook and/or account offers.')
                if(await askYesNo(`Would you like to try reloading the dex?`)) return await dex(loadDexConfigResult)
                else return {result:'warn',message:'The user cancelled using the dex.'}
            }

        }
    }   
    catch(err)
    {
        console.log('There was a problem using the dex...',err)
    }
}
