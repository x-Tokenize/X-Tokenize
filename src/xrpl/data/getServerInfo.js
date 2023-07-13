import {submitRequest} from '../core/requests.js'

 /**
 * @function getServerInfo
 * @description
 * This function retrieves the server information from the XRPL network by submitting a request with the
 * "server_info" method. It then returns an object containing the result, a message, and the server information if the
 * request was successful.
 * 
 * @param {string} networkRPC - The XRPL network RPC URL to submit the request to.
 * @returns {Promise<Object>} - An object containing the result ('success' or 'failed'), a message describing the
 * outcome, and the server information if successful.
 * @throws Will log an error message if there is a problem getting the server information.
 */
export const getServerInfo = async(networkRPC)=>{
    try{
        let serverInfo = await submitRequest({"method":"server_info","params":[]},networkRPC)
        if(serverInfo?.info) return {result:'success',message:'Successfully got the server info.',serverInfo:serverInfo.info}
        else return {result:'failed',message:'Failed to get the server info.'}
    }
    catch(err)
    {
        console.log('There was a problem getting the server info: ',err)
    }
}