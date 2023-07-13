import { warningMessage } from '../../utils/index.js'
import { submitRequest } from '../core/requests.js'

 /**
 * @function getAccountInfo
 * @description
 * Retrieves account information for a given account address on the XRPL network. This function submits a
 * request to the XRPL network using the provided networkRPC and accountAddress. It checks if the account exists and
 * returns the account data if it does, or a warning message if the account is not found.
 * 
 * @param {string} networkRPC - The URL of the XRPL network RPC server.
 * @param {string} accountAddress - The account address to retrieve information for.
 * @returns {Promise<Object>} - An object containing the result ('success', 'warn', or 'failed'), a message
 * describing the outcome, and the account_data if the account exists.
 * @throws {Error} - Throws an error if there is a problem checking the config account.
 */
export const getAccountInfo = async (networkRPC, accountAddress) => {
        try {
            let accountInfo = await submitRequest({ "method": "account_info", "params": [{ "account": accountAddress, "ledger_index": "current" }] }, networkRPC)
            if (accountInfo) {
                if(accountInfo?.error  === 'actNotFound') return {result:'warn',message:`The account ${accountAddress} does not exist on the XRPL network.`,code:'actNotFound'}
                else return {result:'success',message:`The account ${accountAddress} exists on the XRPL network.`,account_data:accountInfo.account_data}
            }
            else return {result:'failed',message:`Failed to get account info!`}
        }
        catch (err) {
            console.log('There was a problem checking the config account: ', err)
            reject(err)
        }
}