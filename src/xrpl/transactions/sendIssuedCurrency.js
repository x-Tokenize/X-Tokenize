import { printResponse } from "../../utils/index.js"
import { transactionHandler } from "../core/transactionHandler.js"

 /**
 * @function sendIssuedCurrency
 * @description
 * Sends an issued currency from one account to another on the XRPL. The function constructs a payment
 * transaction with the specified parameters, submits it to the XRPL, and returns the transaction result.
 * 
 * @param {string} networkRPC - The RPC URL of the XRPL network to submit the transaction to.
 * @param {object} sender - The sender's wallet object containing the address and secret.
 * @param {string} receiver - The destination address to send the issued currency to.
 * @param {string} currencyCode - The currency code of the issued currency to be sent.
 * @param {object} currencyAmount - The amount of the issued currency to be sent, in the format {currency:
 * string, issuer: string, value: string}.
 * @param {object} txOptions - Additional transaction options, such as txMessage and verbose.
 * @returns {Promise<Object>} - An object containing the transaction result, with properties 'result' (success or
 * failure), 'message', and other transaction-related information.
 * @throws {Error} - Throws an error if there is a problem sending the issued currency.
 */
export const sendIssuedCurrency = async(networkRPC,sender,receiver,currencyCode,currencyAmount,txOptions)=>{
        try{
            let tx={
                "TransactionType":"Payment",
                "Account":sender.address,
                "Destination":receiver,
                "Amount":currencyAmount
            }
            txOptions.txMessage =`Sending ${currencyAmount.value} $${currencyCode} from ${sender.address} to ${receiver}`
            let txResult = await transactionHandler(networkRPC,tx,sender,txOptions)
            if(txResult.result === 'success') 
            {
                txResult.message = `Successfully sent ${currencyAmount.value} $${currencyCode} from ${sender.address} to ${receiver}`
                return txResult
            }
            else 
            {
                if(txOptions.verbose)  printResponse(txResult)
                txResult.message = `Failed to send ${currencyAmount.value} $${currencyCode} from ${sender.address} to ${receiver}`
                return txResult
            }
        }
        catch(err)
        {
            console.log('There was a problem sending the issued currency:',err)
        }

}