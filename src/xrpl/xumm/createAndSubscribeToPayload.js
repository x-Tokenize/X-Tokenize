import { configHandler } from "../../config/configHandler.js";
import { createSpinner, pressAnyKey } from "../../utils/index.js";
import { getXummSdk } from "./getXummSdk.js";

 /**
 * @function createAndSubscribeToPayload
 * @description
 * This function creates a XUMM payload and subscribes to its events. It checks if XUMM is properly
 * configured and if the API is reachable. Then, it creates a payload with the given user token, transaction JSON,
 * custom metadata, and options. It subscribes to the payload events to track its status (pending, success, or
 * declined). If the payload is successfully created and signed, it returns the transaction blob and hash. If there are
 * any issues during the process, it returns an appropriate warning or error message.
 * 
 * @param {string} user - The user token for XUMM.
 * @param {object} tx - The transaction JSON to be included in the payload.
 * @param {object} meta - The custom metadata to be included in the payload.
 * @returns {Promise<Object>} - An object containing the result (success, warn, or error), a message
 * describing the outcome, and, if successful, the transaction blob and hash.
 * @throws {Error} - If there is an error during the process, it will be logged to the console.
 */

export const createAndSubscribeToPayload = async(tx,meta)=>{
    try
    {
        let xumm = await getXummSdk()
        let currentConfig = configHandler.getConfigs()
        let token = currentConfig.XTOKENIZE_SETTINGS.xumm.token

        if(xumm===null) return {result:'warn', message:`Failed to initialize XUMM...`}
        else
        {
            let spinner = await createSpinner(`Waiting for you to sign the transaction with your XUMM app...`)
            let payloadStatus= 'pending'
            let signed = false;
            const payload = await xumm.payload.createAndSubscribe(
                {
                    "user_token":token,
                    "txjson":tx,
                    "custom_meta":meta,
                    "options":{submit:false}
                },
                    event => 
                {
                    if (typeof event.data.signed !== 'undefined') {
                        if(event.data.signed === true) payloadStatus = 'success'
                        else payloadStatus = 'declined'
                    }
                })
            if(!payload) 
            {
                spinner.stop();
                return {result:'error',message:'There was a problem creating the XUMM payload.'}
            }
            else
            {
                do{
                    if(payloadStatus === 'declined') 
                    {
                        spinner.stop();
                        return {result:'warn',message:'User declined to sign the transaction.'}
                    }
                    else if(payloadStatus==='success')
                    {
                        spinner.stop()
                        let payloadDetails = await xumm.payload.get(payload.created.uuid)
                        if(!payloadDetails) return {result:'warn',message:'There was a problem getting the XUMM payload details.'}
                        else
                        {
                            if(payloadDetails.meta.resolved ===true && payloadDetails.meta.signed ===true)
                            {
                                signed = true
                                payload.resolve()
                                return {result:'success',message:'Transactions successfully signed',tx_blob:payloadDetails.response.hex,hash:payloadDetails.response.txid}
                            }
                            else
                            {
                                let message
                                if(payloadDetails.meta.signed ===false) message = `User did not sign the transaction.`
                                else if(payloadDetails.meta.resolved ===false) message = `The transaction was not resolved.`
                                return {result:'warn',message:message}
                            }
                        }
                    }
                    else await new Promise(resolve => setTimeout(resolve, 5000));
                } while(signed===false)
            }

        }
    }
    catch(err)
    {
        console.log(err)
    }
}