import { pressAnyKey } from "../../utils/index.js"
import { longRequest } from "../core/requests.js"

 /**
 * @function getAccountTransactions
 * @description
 * Retrieves the transactions associated with a given account on the XRPL. The function accepts an account
 * and a set of options to filter the transactions. It constructs a request object based on the provided options and
 * sends it to the XRPL network using the longRequest function. If successful, it returns an object containing the
 * result, a success message, and the transactions. If unsuccessful, it returns an object containing the result and a
 * failure message.
 * 
 * @param {string} networkRPC - The XRPL network RPC URL.
 * @param {string} account - The account address for which the transactions are to be retrieved.
 * @param {Object} accountTxOptions - An object containing options to filter the transactions.
 * @param {number} accountTxOptions.ledger_index_min - The minimum ledger index to include in the results.
 * @param {number} accountTxOptions.ledger_index_max - The maximum ledger index to include in the results.
 * @param {string} accountTxOptions.ledger_hash - The hash of the ledger to include in the results.
 * @param {number} accountTxOptions.ledger_index - The ledger index to include in the results.
 * @param {boolean} accountTxOptions.binary - If true, the transactions will be returned as binary data.
 * @param {boolean} accountTxOptions.forward - If true, the transactions will be returned in chronological order.
 * @param {number} accountTxOptions.limit - The maximum number of transactions to return.
 * @returns {Promise<Object>} - An object containing the result ('success' or 'failed'), a message, and the transactions
 * (if successful).
 * @throws {Error} - Throws an error if there is a problem getting the account transactions.
 */
export const getAccountTransactions = async(networkRPC,account,accountTxOptions)=>{
        try{
            let {ledger_index_min,ledger_index_max, ledger_hash,ledger_index, binary,forward,limit} =accountTxOptions
            let request = {"method":"account_tx","params":[{"account":account}]}
            if(ledger_index_min) request.params[0].ledger_index_min = ledger_index_min
            if(ledger_index_max) request.params[0].ledger_index_max = ledger_index_max
            if(ledger_hash) request.params[0].ledger_hash = ledger_hash
            if(ledger_index) request.params[0].ledger_index = ledger_index
            if(binary) request.params[0].binary = binary
            if(forward) request.params[0].forward = forward
            if(limit) request.params[0].limit = limit
            let accountTxs = await longRequest("transactions",request,networkRPC)
            if(accountTxs) return {result:'success',message:'Successfully got the account transactions.',transactions:accountTxs}
            else return {result:'failed',message:'Failed to get the account transactions.'}

        }
        catch(err)
        {
            console.log('There was a problem getting the account transactions: ',err)
        }

}