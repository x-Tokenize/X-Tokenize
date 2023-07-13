import { wait } from "../../utils/index.js";
import { submitRequest } from "../core/requests.js";
import {getLatestLedger} from "./getLatestLedger.js"
import {updateVerifiedTransaction} from '../../config/misc/updateVerifiedTransaction.js'


/**
 * @function verifyTransactionResult
 * @description
 * Verifies the result of a transaction by checking its status on the XRPL. The function first submits a
 * request to the XRPL with the transaction hash. If the transaction is not found, it checks if the latest ledger index
 * is greater than the last ledger sequence. If so, the transaction is considered failed. If not, the function waits for
 * 2 seconds and recursively calls itself to check the transaction status again. If the transaction is found and has a
 * 'tesSUCCESS' result, it logs the transaction if log_transactions is true and returns a success object. If the
 * transaction is found but has a different result, it logs the transaction if log_transactions is true and returns a
 * failed object. If the transaction is found but not yet validated, the function waits for 2 seconds and recursively
 * calls itself to check the transaction status again.
 * 
 * @param {string} networkRPC - The network RPC URL for submitting requests.
 * @param {string} txHash - The transaction hash to be verified.
 * @param {number} lastLedgerSequence - The last ledger sequence for the transaction.
 * @param {boolean} log_transactions - A flag to determine if the transaction should be logged or not.
 * @returns {Promise<Object>} - An object containing the result ('success' or 'failed'), message, transaction response,
 * transaction hash, and transaction result code.
 * @throws {Error} - If there is a problem verifying the transaction result.
 */
export const verifyTransactionResult = async(networkRPC,txHash,lastLedgerSequence,log_transactions)=>{
    try
    {
        let txResponse = await submitRequest({"method":"tx","params":[{"transaction":txHash}]},networkRPC)
        if (txResponse?.error === 'txnNotFound')
        {
            let latestLedgerRequest = await getLatestLedger(networkRPC)
            if(latestLedgerRequest.ledger_index > lastLedgerSequence)
            {
              return {result:'failed',message:'Transaction was not applied to the ledger and the LastLedgerSequence has passed.',tx:txResponse,hash:txHash, code:'txnNotFound'}
            }
            else
            {
                await wait(2000)
                return await verifyTransactionResult(networkRPC,txHash,lastLedgerSequence,log_transactions)
            }
        }
        else if(txResponse?.meta && txResponse?.meta?.TransactionResult === 'tesSUCCESS')
        {
            log_transactions?await updateVerifiedTransaction(txResponse.Account,txHash,txResponse.meta.TransactionResult):null
            return {result:'success',message:'Transaction was successful.',tx:txResponse,hash:txHash,code:'tesSUCCESS'}
        }
        else if (txResponse?.meta && txResponse?.meta?.TransactionResult !== 'tesSUCCESS')
        {
            log_transactions?await updateVerifiedTransaction(txResponse.Account,txHash,txResponse.meta.TransactionResult):null
            return {result:'failed',message:`Transaction was not successful with code:${txResponse.meta.TransactionResult}`,tx:txResponse,hash:txHash, code:txResponse.meta.TransactionResult }
        }
        else if(txResponse?.validated===false)
        {
            await wait(2000)
            return await verifyTransactionResult(networkRPC,txHash,lastLedgerSequence,log_transactions)
        }
        
    }
    catch(err)
    {
        console.log('There was a problem verifying the transaction result: ',err)
    }
}