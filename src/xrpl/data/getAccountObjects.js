import {longRequest} from '../core/requests.js'

 /**
 * @function getAccountObjects
 * @description
 * This function retrieves account objects from the XRPL. It can filter the objects based on the provided
 * object type. The supported object types are check, deposit_preauth, escrow, nft_offer, offer, payment_channel,
 * signer_list, state (trust line), and ticket. The function sends a long request to the XRPL network and returns the result.
 * 
 * @param {string} networkRPC - The XRPL network RPC URL.
 * @param {string} address - The account address for which the objects are to be retrieved.
 * @param {string} [objectType] - The type of objects to be retrieved. Optional.
 * @returns {Promise<Object>} - An object containing the result, message, and the retrieved account objects.
 * @throws {Error} - Throws an error if there is a problem getting the account objects.
 */
export const getAccountObjects=  async(networkRPC, address,objectType,)=>{
        try{
            //objectTypes: check, deposit_preauth, escrow, nft_offer, offer, payment_channel, signer_list, state (trust line), and ticket
            let accountObjectsRequest = {'method':'account_objects','params':[{'account':address,'ledger_index':'current'}]}
            if(objectType) accountObjectsRequest.params[0].type = objectType
            let objects = await longRequest("account_objects",accountObjectsRequest,networkRPC)
            if(objects) return {result:'success',message:'Successfully retrieved account objects.',objects}
            else return {result:'warn',message:'There was a problem getting objects.'}
        }
        catch(err)
        {
            console.log('There was a problem getting the account objects: ',err)
            reject(err)
        }
}