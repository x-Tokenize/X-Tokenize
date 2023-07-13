import { getMaximumsForNewFundedOffer } from "./getMaximumsForNewFundedOffer.js"
import { askWhichFromList,askOfferAmount, infoMessage, warningMessage, table, successMessage } from "../../utils/index.js"
import xrpl from "xrpl"


 /**
 * @function createOfferCreateTx
 * @description
 * This function creates an OfferCreate transaction for the XRPL. It prompts the user to choose between a
 * buy or sell offer, and then asks for the XRP per token and number of tokens. It also allows the user to attach a flag
 * to the transaction, such as Passive, Immediate or Cancel, Fill or Kill, or tfSell (Market Order). The function
 * returns an object containing the result, a message, and the OfferCreate transaction object if successful.
 * 
 * @param {string} networkRPC - The network RPC URL.
 * @param {string} currencyCode - The currency code of the issued currency.
 * @param {string} currencyHex - The currency hex code of the issued currency.
 * @param {string} issuerAddress - The address of the issuer of the issued currency.
 * @param {string} accountAddress - The address of the account creating the offer.
 * @param {Array} offers - The list of existing offers.
 * @returns {Promise<Object>} - An object containing the result ('success' or 'warn'), a message, and the OfferCreate
 * transaction object if successful.
 * @throws {Error} - If there is a problem generating the OfferCreate transaction.
 */
export const createOfferCreateTx = async(networkRPC,currencyCode,currencyHex,issuerAddress,accountAddress,offers)=>{
    try{
        let baseOfferCreateTX = 
        {
            "TransactionType":"OfferCreate",
            "Account":accountAddress,
            "Flags": 0,
            "TakerGets":{},
            "TakerPays": {},
        }
        
        let maximums = await getMaximumsForNewFundedOffer(networkRPC,currencyCode,currencyHex,issuerAddress,accountAddress,offers)
        if(maximums.result!==`success`) return {result:'warn',message:'There was a problem getting the maximums for a new offer.'}
        else
        {
            let {maxXRP,maxIC} = maximums;
            let offerType = await askWhichFromList(`Would you like to place a buy or sell offer?`,['Buy','Sell','Cancel'])
            if(offerType==='Cancel') return {result:'warn',message:'The user cancelled creating a new offer.'}
            else
            {
                if(offerType === 'Buy')
                {
                    let xrpPerToken = await askOfferAmount(`$XRP per Token? (min:0.000001,max:${maxXRP})`,maxXRP)
                    let maxNumberOfTokens = Number(maxXRP)/Number(xrpPerToken)
                    let numberOfTokens = await askOfferAmount(`Number of Tokens? (min:0.000001,max:${maxNumberOfTokens})`,maxNumberOfTokens)
                    
                    baseOfferCreateTX.TakerPays = {currency:currencyHex,issuer:issuerAddress,value:numberOfTokens.toString()}
                    baseOfferCreateTX.TakerGets =xrpl.xrpToDrops((Number(xrpPerToken)*Number(numberOfTokens)).toFixed(15))
                    // return {result:'success',message:'Successfully created an offer create transaction.',offerCreateTX:baseOfferCreateTX}
                
                }
                else if(offerType === 'Sell')
                {
                    let numberOfTokens = await askOfferAmount(`Number of Tokens? (min:0.000001,max:${maxIC})`,maxIC)
                    let xrpPerToken = await askOfferAmount(`$XRP per Token? (min:0.000001)`,Math.pow(10,8))

                    baseOfferCreateTX.TakerGets = {currency:currencyHex,issuer:issuerAddress,value:numberOfTokens.toString()}
                    baseOfferCreateTX.TakerPays =xrpl.xrpToDrops((Number(xrpPerToken)*Number(numberOfTokens)).toFixed(15))
                    // return {result:'success',message:'Successfully created an offer create transaction.',offerCreateTX:baseOfferCreateTX}
                }

                warningMessage(`Transaction Flags:`)
                successMessage(`Passive:`)
                infoMessage(`The offer will not consume offers that exactly match it, and will instead become an Offer node in the ledger.\nOffers that cross it will still be consumed.`)
                console.log()
                successMessage(`Immediate or Cancel:`)
                infoMessage(`The offer consumes as much as it can by attempting to cross existing offers while the transaction is being processed.\nThis does not create an offer node on the ledger after it is processed.`)
                console.log()
                successMessage(`Fill or Kill:`)
                infoMessage(`The offer consumes as much as it can by attempting to cross existing offers while the transaction is being processed.\nIf the offer cannot be completely filled, then none of it is filled.`)
                console.log()
                successMessage(`tfSell (Market Order):`)
                infoMessage(`The offer consumes the entire TakerGets amount, even if it means obtaining more takerPays than the TakerPays amount would have otherwise paid for.\n`)
                console.log()

                let attachFlagToTransaction = await askWhichFromList(`Would you like to attach a flag to this transaction?`,[`Passive`,`Immediate or Cancel`,`Fill or Kill`,`tfSell (Market Order)`,`None`])
                if(attachFlagToTransaction==='None') return {result:'success',message:'Successfully created an offer create transaction.',offerCreateTX:baseOfferCreateTX}
                else
                {
                    if(attachFlagToTransaction==='Passive') baseOfferCreateTX.Flags = xrpl.OfferCreateFlags.tfPassive
                    else if(attachFlagToTransaction==='Immediate or Cancel') baseOfferCreateTX.Flags = xrpl.OfferCreateFlags.tfImmediateOrCancel
                    else if(attachFlagToTransaction==='Fill or Kill') baseOfferCreateTX.Flags = xrpl.OfferCreateFlags.tfFillOrKill
                    else if(attachFlagToTransaction==='tfSell (Market Order)') baseOfferCreateTX.Flags = xrpl.OfferCreateFlags.tfSell
                    return {result:'success',message:'Successfully created an offer create transaction.',offerCreateTX:baseOfferCreateTX}
                }
            }
        }
    }
    catch(err)
    {
        console.log('There was a problem generating an offer create transaction...')
        console.log(err)
    }

}