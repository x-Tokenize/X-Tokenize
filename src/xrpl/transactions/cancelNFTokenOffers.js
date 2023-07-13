import { pressAnyKey,printResponse } from "../../utils/index.js"
import { transactionHandler } from "../core/transactionHandler.js"

 /**
 * @function cancelNFTokenOffers
 * @description
 * This function cancels a specified number of NFT offers on a given account. It constructs a transaction
 * object with the necessary information, such as the account address and the NFT offer IDs to be cancelled. It then
 * calls the transactionHandler function to handle the transaction and returns the result of the operation.
 * 
 * @param {string} networkRPC - The network RPC URL to interact with the XRPL.
 * @param {object} account - The account object containing the account address.
 * @param {Array<string>} nftokenOfferIDs - An array of NFT offer IDs to be cancelled.
 * @param {object} txOptions - The transaction options object containing verbose flag and txMessage.
 * @returns {Promise<Object>} - An object containing the result of the operation, a message, and other
 * transaction-related information.
 * @throws {Error} - Throws an error if there is a problem cancelling the NFT offers.
 */
export const cancelNFTokenOffers = async(networkRPC,account,nftokenOfferIDs,txOptions)=>{
    try
    {
        let {verbose} = txOptions
        let tx = {
            "TransactionType":"NFTokenCancelOffer",
            "Account":account.address,
            "NFTokenOffers":nftokenOfferIDs,
            "Flags":0
        }
        txOptions.txMessage = `Cancelling ${nftokenOfferIDs.length} NFT offers on ${account.address}.`

        let txResult = await transactionHandler(networkRPC,tx,account,txOptions)
        if(txResult.result === 'success')
        {
            txResult.message = `Successfully cancelled ${nftokenOfferIDs.length} NFT offers on ${account.address}.`
            return txResult
        }
        else
        {
            if(verbose) printResponse(txResult)
            txResult.message = `Failed to cancel ${nftokenOfferIDs.length} NFT offers on ${account.address}.`
            await pressAnyKey()
            return txResult
        }
    }
    catch(err)
    {
        console.log('There was a problem cancelling the NFT offers: ',err)
    }
}