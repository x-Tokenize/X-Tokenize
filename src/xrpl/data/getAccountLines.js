import {longRequest} from '../core/requests.js'

 /**
 * @function getAccountLines
 * @description
 * This function retrieves the account lines (trust lines) for a given XRPL address. It sends a request to
 * the specified networkRPC with the account_lines method and the address as a parameter. The function then processes
 * the response and returns an object containing the result, a message, and the account lines if successful.
 *
 * @param {string} networkRPC - The network RPC URL to send the request to.
 * @param {string} address - The XRPL address for which to retrieve the account lines.
 * @returns {Promise<Object>} - An object containing the result ('success' or 'warn'), a message, and the
 * account lines if successful.
 * @throws {Error} - If there is a problem getting the account lines, an error is thrown.
 */
export const getAccountLines=  async(networkRPC, address)=>{
        try{
            let request = {'method':'account_lines','params':[{'account':address,'ledger_index':'current'}]}
            let lines = await longRequest("lines",request,networkRPC)
            if(lines) return {result:'success',message:'Successfully retrieved account lines.',lines}
            else return {result:'warn',message:'There was a problem getting lines.'}
          
        }
        catch(err)
        {
            console.log('There was a problem getting the account offers: ',err)
            reject(err)
        }
}