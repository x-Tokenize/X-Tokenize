import { warningMessage } from "../../utils/index.js"
import { submitRequest } from "../core/requests.js"

 /**
 * @function pingRPC
 * @description
 * This function sends a ping request to the specified XRPL network RPC server to check its availability.
 * It uses the submitRequest function to send a "ping" method request to the server. If the server responds, the
 * function returns true, indicating that the server is reachable. If the server does not respond or an error occurs,
 * the function returns false and logs a warning message or error details.
 * 
 * @param {string} networkRPC - The URL of the XRPL network RPC server to ping.
 * @returns {Promise<boolean>} - A promise that resolves to true if the server is reachable, and false otherwise.
 * @throws Will log any errors that occur during the ping request.
 */
export const pingRPC = async(networkRPC)=>{
    try{
        let pingResponse = await submitRequest({ "method": "ping", "params": [{}] }, networkRPC)
        if(pingResponse) return true
        else
        {
            warningMessage(`Failed to reach the ${networkRPC} server.`)
            return false
        }
    }
    catch(err)
    {
        console.log(`error pinging the ${networkRPC} server: `,err)
    }
}