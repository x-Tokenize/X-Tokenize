import {submitRequest} from '../core/requests.js'

/**
 * @function getLatestLedger
 * @description
 * Retrieves the latest validated ledger information from the XRPL network. The function submits a request
 * to the networkRPC with the method "ledger" and the parameter "ledger_index" set to "validated". If the request is
 * successful, it returns an object containing the result, a success message, and the ledger information. If the request
 * fails, it returns an object with the result set to "failed" and an error message.
 * 
 * @param {string} networkRPC - The XRPL network RPC URL to submit the request to.
 * @returns {Promise<Object>} - An object containing the result ('success' or 'failed'), a message describing the
 * outcome, and the ledger information (if successful).
 * @throws {Error} - If there is a problem with the request or an issue retrieving the latest ledger information.
 */

export const getLatestLedger = async(networkRPC)=>{
        try{
            let latestLedger = await submitRequest({"method":"ledger","params":[{"ledger_index":"validated"}]},networkRPC)
            if(latestLedger?.ledger) return {result:'success',message:'Successfully got the latest ledger info.',ledger:latestLedger.ledger}
            else return {result:'failed',message:'Failed to get the latest ledger info.'}
        }
        catch(err)
        {
            console.log('There was a problem getting the latest ledger: ',err)
        }
}

