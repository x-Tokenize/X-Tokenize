import {longRequest} from '../core/requests.js'

/**
 * @function getAllTrustlinesToAnIssuer
 * @description
 * Retrieves all trustlines to a specified issuer address on the XRPL. It sends a long request to the XRPL
 * network using the account_lines method and returns the trustlines if found.
 * 
 * @param {string} networkRPC - The XRPL network RPC URL.
 * @param {string} issuerAddress - The issuer address for which trustlines are to be retrieved.
 * @returns {Promise<Object>} - An object containing the result, message, and an array of trustlines.
 * @throws {Error} - If there is an issue with the request or retrieving the trustlines.
 */
export const getAllTrustlinesToAnIssuer = async (networkRPC, issuerAddress) => {
        try {
            let dataPointName = "lines"
            let request= { "method": "account_lines", "params": [{ "account": issuerAddress, "ledger_index": "current"}] }
            let lines = await longRequest(dataPointName,request,networkRPC)
            if(lines && lines.length>0)
            {
                return { result: 'success', message: 'The trustlines were retrieved successfully.', lines: lines }
            }
            else return { result: 'warn', message: 'No trustlines were found.', lines: [] }
        }
        catch (err) {
            console.log('There was a problem checking the config account: ', err)
            reject(err)
        }


}