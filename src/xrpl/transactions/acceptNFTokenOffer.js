import { fancyMessage,pressAnyKey,printResponse } from "../../utils/index.js"
import { transactionHandler } from "../core/transactionHandler.js"

 /**
 * @function acceptNFTokenOffer
 * @description
 * Accepts an NFT offer on the XRPL. The function supports direct mode only (brokered mode is not yet
 * supported). The function constructs a transaction object with the required fields and then calls the
 * transactionHandler to process the transaction.
 * 
 * @param {string} networkRPC - The network RPC URL.
 * @param {object} account - The account object containing the account address.
 * @param {object} acceptNFTokenOfferOptions - The options object containing mode, sellOffer, buyOffer, and brokerFee.
 * @param {object} txOptions - The transaction options object containing verbose flag.
 * @returns {Promise<Object>} - An object containing the result and message of the transaction.
 * @throws {Error} - Throws an error if there is a problem accepting the NFT offer.
 */
export const acceptNFTokenOffer = async(networkRPC,account,acceptNFTokenOfferOptions,txOptions)=>{
    try
    {
        //TODO: ADD BROKERED MODE SUPPORT
        let {mode,sellOffer,buyOffer,brokerFee} = acceptNFTokenOfferOptions
        let {verbose} = txOptions
        let tx = {
            "TransactionType":"NFTokenAcceptOffer",
            "Account":account.address,
        }
        let offerID,offerType
        if(mode==='direct')
        {
            if(sellOffer!== undefined)
            {
                tx.NFTokenSellOffer = sellOffer
                offerID = sellOffer
                offerType = 'sell'
            }
            else
            {
                tx.NFTokenBuyOffer = buyOffer
                offerID = buyOffer
                offerType = 'buy'
            }
            txOptions.txMessage = `Accepting NFT ${offerType} offer on ${account.address} for offer ID ${offerID}.`
        }
        else if(mode==='brokered')
        {
            fancyMessage(`Brokered mode is not yet supported.`)
            return {result:'error',message:`Brokered mode is not yet supported.`}
        }

        let txResult = await transactionHandler(networkRPC,tx,account,txOptions)
        if(txResult.result === 'success') 
        {
            txResult.message = `Successfully accepted NFT ${offerType} offer on ${account.address} for offer ID ${offerID}.`
            return txResult
        }
        else
        {
            if(verbose) printResponse(txResult)
            txResult.message =`Failed to accept NFT ${offerType} offer on ${account.address} for offer ID ${offerID}.`
            await pressAnyKey()
            return txResult
        }
    }
    catch(err)
    {
        console.log(`There was a problem accepting the NFT ${offerType} offer: `,err)
    }
}