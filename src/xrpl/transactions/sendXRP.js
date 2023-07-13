import {dropsToXrp} from 'xrpl'
import {transactionHandler} from "../core/transactionHandler.js"
import {printResponse} from "../../utils/index.js"

 /**
 * @function sendXRP
 * @description
 * This function sends XRP from one address to another using the XRPL. It creates a transaction object
 * with the necessary details, such as sender's address, receiver's address, and the amount to be sent. The transaction
 * is then handled by the transactionHandler function, which takes care of signing and submitting the transaction to the
 * network. If the transaction is successful, the function returns an object with the result and a success message. If
 * the transaction fails, it returns an object with the result and a warning message. In case of any errors, the
 * function logs the error message.
 * 
 * @param {object} networkRPC - The network RPC object used to interact with the XRPL.
 * @param {object} sender - The sender's wallet object containing the address and secret.
 * @param {string} receiverAddress - The address of the receiver to whom the XRP will be sent.
 * @param {string} amount - The amount of XRP to be sent, in drops.
 * @param {object} txOptions - An object containing transaction options such as txMessage and verbose.
 * @returns {Promise<Object>} - An object containing the result (success or warn) and a message describing the outcome
 * of the transaction.
 * @throws {Error} - If there is a problem sending XRP, the function logs the error message.
 */
export const sendXRP = async(networkRPC,sender,receiverAddress, amount,txOptions) => {
    try{
        let tx = {
            "TransactionType":"Payment",
            "Account":sender.address,
            "Amount":amount,
            "Destination":receiverAddress
        }
        txOptions.txMessage = `Sending ${dropsToXrp(amount)} $XRP from ${sender.address} to ${receiverAddress}`
        let txResult = await transactionHandler(networkRPC,tx,sender,txOptions)
        if(txResult.result === 'success') return {result:'success',message:`Successfully sent ${dropsToXrp(amount)} $XRP from ${sender.address} to ${receiverAddress}`}
        else 
        {
            if(txOptions.verbose)  printResponse(txResult)
            return {result:'warn',message:`Failed to send the xrp.`}
        }
    }
    catch(err)
    {
        console.log('There was a problem sending XRP: ',err)
    }
}