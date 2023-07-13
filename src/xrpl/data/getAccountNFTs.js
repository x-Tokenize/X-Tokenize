import {longRequest} from '../core/requests.js'


 /**
 * @function getAccountNFTs
 * @description
 * This function retrieves the Non-Fungible Tokens (NFTs) associated with a given account address on the
 * XRPL. It makes use of the 'account_nfts' method and sends a request to the specified networkRPC. The function returns
 * an object containing the result, a message, and the NFTs if the retrieval is successful.
 * 
 * @param {string} networkRPC - The network RPC URL to send the request to.
 * @param {string} address - The account address for which the NFTs need to be retrieved.
 * @returns {OperationResult} - An object containing the result ('success' or 'warn'), a message, and the
 * NFTs if successful.
 * @throws {Error} - If there is a problem getting the account NFTs, an error will be thrown and logged.
 */
export const getAccountNFTs=  async(networkRPC, address)=>{
        try{
            let nftsRequest = {'method':'account_nfts','params':[{'account':address,'ledger_index':'current'}]}
            let nfts = await longRequest("account_nfts",nftsRequest,networkRPC)
            if(nfts) return {result:'success',message:'Successfully retrieved account nfts.',nfts}
            else return {result:'warn',message:'There was a problem getting nfts.'}
        }
        catch(err)
        {
            console.log('There was a problem getting the account nfts: ',err)
            reject(err)
        }
}