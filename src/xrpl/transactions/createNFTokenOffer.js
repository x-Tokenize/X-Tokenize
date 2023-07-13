import { pressAnyKey, printResponse } from "../../utils/index.js"
import { transactionHandler } from "../core/transactionHandler.js"
import { dropsToXrp } from "xrpl"

 /**
 * @function createNFTokenOffer
 * @description
 * This function creates an NFT offer on the XRPL by constructing a transaction object and submitting it
 * using the transactionHandler. The function takes in several parameters to configure the NFT offer, such as the
 * account making the offer, the NFT token ID, the amount, and various options for the offer. It also supports verbose
 * output and handles success and failure cases.
 * 
 * @param {object} networkRPC - The network RPC object to interact with the XRPL.
 * @param {object} account - The account object containing the address of the account creating the NFT offer.
 * @param {string} nftokenID - The NFT token ID for the offer.
 * @param {string|object} amount - The amount for the offer, either as a string for XRP or an object with value,
 * currency, and issuer for issued currencies.
 * @param {object} nftokenOfferOptions - The NFT offer options object containing destination, sale,
 * expiration, and owner properties.
 * @param {object} txOptions - The transaction options object containing verbose property and txMessage to
 * be set during the function execution.
 * @returns {Promise<Object>} - The transaction result object containing result, message, and other properties
 * depending on the success or failure of the transaction.
 * @throws {Error} - Throws an error if there is a problem creating the NFT offer.
 */

export const createNFTokenOffer= async(networkRPC,account,nftokenID,amount,nftokenOfferOptions,txOptions)=>{
        try{
            let {verbose} = txOptions
            let {destination,sale,expiration,owner,} = nftokenOfferOptions
            let tx = {
                "TransactionType":"NFTokenCreateOffer",
                "Account":account.address,
                "NFTokenID":nftokenID,
                "Amount":amount,
                "Flags":sale?1:0,
            }
            if(destination) tx.Destination = destination
            if(expiration) tx.Expiration = expiration
            if(owner) tx.Owner = owner

            txOptions.txMessage = `Creating NFT offer on ${account.address} to ${sale?'sell':'buy'} ${nftokenID} `
            if(!sale) txOptions.txMessage += ` from ${owner} `
            if(destination) txOptions.txMessage += ` to ${destination} `
            if(typeof amount ==='string') txOptions.txMessage += ` for ${dropsToXrp(Number(amount))} $XRP.`
            else txOptions.txMessage += ` for ${amount.value} $${amount.currency} issued by ${amount.issuer}.`
            
            let txResult = await transactionHandler(networkRPC,tx,account,txOptions)
            if(txResult.result === 'success') 
            {
                txResult.message = `Successfully created NFT offer on ${account.address} to ${sale?'sell':'buy'} ${nftokenID} `
                return txResult
            }
            else
            {
                if(verbose) printResponse(txResult)
                txResult.message =`Failed to create NFT offer on ${account.address} to ${sale?'sell':'buy'} ${nftokenID} `
                await pressAnyKey()

                return txResult
            }
        }
        catch(err)
        {
            console.log("There was a problem creating the NFT offer: ",err)
        }


    //some change





}