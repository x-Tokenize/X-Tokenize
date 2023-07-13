import { askYesNo, infoMessage, pressAnyKey, printBanner, printQR, wait } from "../../utils/index.js"
import { getXummSdk } from "./getXummSdk.js"
import {XummSdk,XummSdkJwt} from 'xumm-sdk'
import {XummPkce} from 'xumm-oauth2-pkce'
import axios from 'axios'
import open from 'open'
const oAuth = new XummPkce('22c185ec-a903-46e8-9d6d-50e993744e16')
/**
 * @function xummSignIn
 * @description
 * This function is responsible for signing in a user using the XUMM app. It first checks if XUMM is
 * properly configured, then pings the XUMM API to ensure it's reachable. If successful, it creates a payload with a
 * SignIn transaction type and custom metadata, then subscribes to the payload event. It generates a QR code for the
 * user to scan with the XUMM app and waits for the payload status to change. If the user signs in successfully and
 * confirms the correct account, the function returns the account address and user token. If there are any issues or the
 * user declines, appropriate messages are returned.
 * 
 * @returns {Promise<Object>} - An object containing the result (success, warn, or error), a message describing the outcome,
 * and optionally the account address and user token if the sign in is successful.
 * @throws Error if there is a problem signing in with XUMM.
 */
export const xummSignIn = async(refreshToken)=>{
    try
    {
        let xumm = await getXummSdk(refreshToken)
        if(!xumm) return {result:'warn', message:`Failed to initialize XUMM...`}
        else
        {
            let payloadStatus= 'pending'
            let signed = false;
            const payload = await xumm.payload.createAndSubscribe(
                {
                    txjson:
                    { 
                        TransactionType: 'SignIn'
                    },
                    custom_meta:
                    {
                        instruction:refreshToken?'You are about to refresh your user token for \nX-Tokenize\n You can sign in with any account as long as it is in on the same device.':
                        "You are about to add your account to \nX-Tokenize\n🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨\n Please double check that \nyou are using the correct \naddress for this configuration!\n🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨🚨\n"
                    }
                },
                event => 
                {
                    if (typeof event.data.signed !== 'undefined') {
                        if(event.data.signed === true) payloadStatus = 'success'
                        else payloadStatus = 'declined'
                    }
                })
            if(!payload) return {result:'error',message:'There was a problem creating the XUMM payload.'}
            else
            {
                let signInUrl = payload.created.next.always
                await printQR(signInUrl)
                infoMessage(`If you did not receive a push notification to sign in:\n Scan the QR code with the XUMM app to sign in!`)
                do{
                    if(payloadStatus === 'declined') return {result:'warn',message:'Sign in was declined.'}
                    else if(payloadStatus==='success')
                    {
                        let payloadDetails = await xumm.payload.get(payload.created.uuid)
                        
                        if(!payloadDetails) return {result:'warn',message:'There was a problem getting the XUMM payload details.'}
                        else
                        {
                            if(payloadDetails.meta.resolved ===true && payloadDetails.meta.signed ===true)
                            {
                                signed = true
                                payload.resolve()
                                printBanner()
                                infoMessage(`You signed in with account: ${payloadDetails.response.account}`)
                                if(await askYesNo(`Is this the correct account?`,true)) return {result:'success',message:'Sign in successful',address:payloadDetails.response.account,user:payloadDetails.application.issued_user_token, api:payloadDetails.application.uuidv4}
                                else return await xummSignIn()
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
        console.log('There was a problem signing in with XUMM: ',err)
    }
}
