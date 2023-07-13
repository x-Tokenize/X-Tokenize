import {longRequest} from '../core/requests.js'

 /**
 * @function getAccountOffers
 * @description
 * Retrieves the account offers for a given address on the XRPL. This function sends a request to the XRPL
 * network using the provided networkRPC and address. It then processes the response and returns an object containing
 * the result, a message, and the offers if successful.
 * 
 * @param {string} networkRPC - The XRPL network RPC URL to send the request to.
 * @param {string} address - The address of the account for which to retrieve the offers.
 * @returns {Promise<Object>} - An object containing the result ('success' or 'warn'), a message, and the
 * offers if successful.
 * @throws {Error} - If there is a problem getting the account offers, an error is thrown and logged.
 */
export const getAccountOffers=  async(networkRPC, address)=>{
        try{
            let offersRequest = {'method':'account_offers','params':[{'account':address,'ledger_index':'current'}]}
            let offers = await longRequest("offers",offersRequest,networkRPC)
            if(offers) return {result:'success',message:'Successfully retrieved account offers.',offers}
            else return {result:'warn',message:'There was a problem getting offers.'}
        }
        catch(err)
        {
            console.log('There was a problem getting the account offers: ',err)
            reject(err)
        }
}