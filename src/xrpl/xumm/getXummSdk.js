import {XummSdk,XummSdkJwt} from 'xumm-sdk'
import {configHandler} from '../../config/configHandler.js'
import { askYesNo, errorMessage, handleSeedEncryptionDecryption, infoMessage, pressAnyKey, wait, warningMessage } from '../../utils/index.js';
import { refreshAccessTokenServer } from "./refreshAccessTokenServer.js"


let xumm = null;
/**
 * @function getXummSdk
 * @description
 * This function is responsible for initializing and returning an instance of the XummSdk. It first checks
 * if an instance of XummSdk already exists, and if so, returns it. If not, it retrieves the Xumm API key and secret
 * from the XTOKENIZE_SETTINGS configuration and creates a new instance of XummSdk with the provided key and secret. If
 * the key and secret are not present in the configuration, the function returns null.
 *
 * @returns {Promise<XummSdk|null>} - An instance of the XummSdk if the API key and secret are available in the configuration,
 * or null if they are not.
 */



export const getXummSdk = async(refreshToken)=>{
    try
    {
        if(xumm && !refreshToken)
        {
            let pong = await xumm.ping()
            if(!pong || !pong.application)
            {
                xumm = null
                return await initializeXummSDK()
            }
            else return xumm
        }
        else return await initializeXummSDK()
    
    }
    catch(err)
    {
        console.log(`There was a problem initializing the Xumm SDK: ${err}`)
    }
}

export const initializeWithApiKeys = async(settings) =>{
    try{
        if(settings.xumm.key !=="" && settings.xumm.secret !=="")
        {
            const pattern = /^[\da-f]{8}-[\da-f]{4}-[\da-f]{4}-[\da-f]{4}-[\da-f]{12}$/;
            let secret
            if(settings.xumm.secretEncrypted)
            {
                warningMessage(`It looks like your XUMM API hasn't been decrypted since launch.`)
                let decrypted = await handleSeedEncryptionDecryption(settings.xumm.secret,true)
                if(!pattern.test(decrypted.seed)){
                    warningMessage(`It looks like you entered the wrong password or pin or misconfigured xumm in the settings.`)
                    if(await askYesNo(`Would you like to try again?`)) return await getXummSdk()
                    else
                    {
                        errorMessage(`You will need to decrypt your XUMM API secret to use this feature.`)
                        return null
                    }
                }
                else secret = decrypted.seed
            } 
            else secret = settings.xumm.secret
          
            if(!pattern.test(secret))
            {
                errorMessage(`The XUMM API secret in your configuration is invalid.`)
                return null
            }
            else secret = settings.xumm.secret
        
            
            xumm = new XummSdk(settings.xumm.key,secret)
            let pong = await xumm.ping()
            if(!pong && !pong.application)
            {
                xumm = null
                errorMessage(`There was a problem contacting the XUMM API.`)
                if(settings.xumm.secretEncrypted)
                {
                    warningMessage(`You might have typed in the wrong password or pin...`)
                    if(await askYesNo(`Would you like to try again?`)) return await getXummSdk()
                    else return null
                }
                else return null
            } 
            else return xumm
        }
        else
        {
            errorMessage(`You will need to configure your XUMM API key and secret in the X-Tokenize settings to use this feature.`)
            return null
        }
    }
    catch(err)
    {
        console.log(`There was a problem initializing Xumm With API Keys...`)
    }
}

export const isExpired= (settings) =>{
    {
        let now = new Date().getTime();
        if (settings.xumm.expires < now)return true
        else return false
    }
}

export const initializeWithAccessToken = async(settings) =>{
    try
    {   let refreshedAccessToken = null
        if(!isExpired(settings) && settings.xumm.token !=="" && settings.xumm.token !== null) refreshedAccessToken = settings.xumm.token

        if(refreshedAccessToken === null)
        {
            warningMessage(`It looks like it's time to refresh your XUMM access token.`)
            infoMessage(`On the device you wish to use, Sign in with any account to refresh access.`)
            console.log()
            warningMessage(`Please note that this is just refreshing the access token:\n You should receive a notification after refreshing to continue with the operation you were trying to perform.`)

            let refreshServer = await refreshAccessTokenServer(settings.xumm.key)
            let timeoutAttempts = 20;
            do{
                let latest_settings = await configHandler.getConfigs(`XTOKENIZE_SETTINGS`)
                if(latest_settings.xumm.token!== settings.xumm.token )  refreshedAccessToken = latest_settings.xumm.token
                else await wait(5000)
            }while(refreshedAccessToken === null || timeoutAttempts-- === 0)
            refreshServer.close()
        }
        if(refreshedAccessToken === null) return null
        else
        {
            xumm = new XummSdkJwt(refreshedAccessToken)
            let pong = await xumm.ping()
            if(!pong && !pong.application)
            {
                xumm = null
                errorMessage(`There was a problem contacting the XUMM API.`)
                return null
            } 
            else return xumm
        }
    }
    catch(err)
    {
        console.log(err)
        console.log(`There was a problem initializing Xumm With access token...`)
    }
}

export const initializeXummSDK = async()=>
{
    const settings= configHandler.getConfigs(`XTOKENIZE_SETTINGS`)
    switch(settings.xumm.type)
    {
        case 'API_KEYS':
            return await initializeWithApiKeys(settings)
        case 'ACCESS_TOKEN':
            return await initializeWithAccessToken(settings)
    }
}

