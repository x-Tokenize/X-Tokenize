import {getXummSdk} from './getXummSdk.js'

 /**
 * @function pingSDK
 * @description
 * This function checks the connectivity to the XUMM SDK by sending a ping request. It first retrieves the
 * XUMM SDK instance using the getXummSdk function and then sends a ping request using the xumm.ping() method. If the
 * response contains an 'application' property, the function returns true, indicating a successful connection. If not,
 * it returns false. If an error occurs during the process, it is caught and logged to the console.
 * 
 * @param {Object} sdk - The XUMM SDK instance.
 * @returns {Promise<boolean>} - Returns true if the ping is successful and the 'application' property is present in
 * the response, otherwise returns false.
 * @throws {Error} - If an error occurs during the process, it is caught and logged to the console.
 */
export const pingSDK = async(sdk)=>{
    try
    {
        let xumm = await getXummSdk()
        let pong = await xumm.ping()
        if(pong && pong.application) return true
        else return false
    }
    catch(err)
    {
        console.log(err)
    }
}