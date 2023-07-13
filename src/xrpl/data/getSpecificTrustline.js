import { submitRequest } from "../core/requests.js"

 /**
 * @function getSpecificTrustline
 * @description
 * This function retrieves the trustline information for a specific currency between an issuer and a
 * trustee. It filters the trustlines to find the one matching the provided currency hex and returns the result along
 * with a message indicating the status of the trustline.
 * 
 * @param {string} networkRPC - The network RPC URL to submit the request to.
 * @param {string} currencyHex - The currency hex code to filter the trustlines.
 * @param {string} issuerAddress - The address of the issuer of the currency.
 * @param {string} trusteeAddress - The address of the trustee holding the trustline.
 * @returns {Promise<Object>} - An object containing the result ('success', 'warn', or 'failed'), a message
 * describing the outcome, and the trustline object if it exists.
 * @throws {Error} - Throws an error if there is a problem checking the config account.
 */
export const getSpecificTrustline = async (networkRPC,currencyHex, issuerAddress, trusteeAddress) => {
    try {
        console.log()

        let trustlineInfo = await submitRequest({ "method": "account_lines", "params": [{ "account": trusteeAddress, "peer": issuerAddress, "ledger_index": "current" }] }, networkRPC)
        if(trustlineInfo)
        {
            let trustlineExists = trustlineInfo.lines.filter((line) => {
                return line.currency === currencyHex
            })
            if (trustlineExists.length > 0) return {result:'success',message:'The trustline exists.',trustline:trustlineExists[0]}
            else return {result:'warn',message:'The trustline does not exist.'}
        }
        else
        {
            return {result:'failed',message:'Failed to get the trustline information.'}
        }
        

    }
    catch (err) {
        console.log('There was a problem checking the config account: ', err)
        reject(err)
    }
}