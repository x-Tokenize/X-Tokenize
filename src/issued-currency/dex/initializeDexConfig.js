import { configHandler } from "../../config/configHandler.js";
import { askWhichFromList, askCurrencyInfo, printResponse, fancyMessage } from "../../utils/index.js";

/**
 * @function initializeDexConfig
 * @description
 * This function initializes the configuration for the DEX (Decentralized Exchange) by retrieving the
 * current configuration and determining if the application is in Issued Currency mode or not. If in Issued Currency
 * mode, it sets the necessary values for networkRPC, currencyCode, currencyHex, issuerAddress, and account. If not in
 * Issued Currency mode, it prompts the user to select an account and currency information, then sets the values
 * accordingly. The function returns an object containing the result, message, and the initialized values if successful,
 * or a warning message if there was a problem or the user cancelled the operation.
 * 
 * @returns {Promise<Object>} - An object containing the result ('success' or 'warn'), message, networkRPC, account,
 * currencyCode, currencyHex, issuerAddress, and isInICMode (boolean) properties. If the result is 'warn', the object
 * will only contain the result and message properties.
 * @throws {Error} - If there is a problem loading the DEX configuration, an error will be logged to the console.
 */
export const initializeDexConfig = async()=>{
        try
        {
            let currentConfig = configHandler.getConfigs();
            let networkRPC, currencyCode, currencyHex, issuerAddress, account,isInICMode;
            if(typeof currentConfig?.IC?.name !=='undefined')
            {
                networkRPC = currentConfig.IC.networkRPC
                currencyCode = currentConfig.IC.currencyCode
                currencyHex = currentConfig.IC.currencyHex
                issuerAddress = currentConfig.IC.issuer.address
                account = currentConfig.IC.treasury
                isInICMode = true
            }
            else 
            {
                let settings = currentConfig.XTOKENIZE_SETTINGS;
                if(settings.networkRPC === null) return {result:'warn',message:'No network configured in the settings. Please configure a network first.'}
                else networkRPC=settings.networkRPC

                if(settings.accounts.length===0) return {result:'warn',message:'No accounts configured in the settings. Please configure an account first.'}
                else {
                    let names = settings.accounts.map(account=>account.name)
                    names.push('Cancel')
                    let accountToUse = await askWhichFromList(`Which account would you like to use for the dex?`,names)
                    if(accountToUse==='Cancel') return {result:'warn',message:'The user cancelled using the dex.'}
                    else account = settings.accounts.find(account=>account.name===accountToUse)
                    
                }
                if(typeof networkRPC!=='undefined' && typeof account!=='undefined')
                {
                    //TODO: ADD A LIST OF POPULAR ICs TO CHOOSE FROM
                    fancyMessage(`SOON YOU WILL BE ABLE TO SELECT FROM A LIST OF POPULAR TRADING PAIRS ON THE XRPL DEX.`)
                   let getCurrencyInfoResponse = await askCurrencyInfo()
                   if(getCurrencyInfoResponse.result==='success')
                   {
                       currencyCode = getCurrencyInfoResponse.enteredCurrencyCode
                       currencyHex = getCurrencyInfoResponse.hex
                       issuerAddress = getCurrencyInfoResponse.enteredCurrencyIssuer
                       isInICMode = false
                   }
                   else
                   {
                       printResponse(getCurrencyInfoResponse)
                       return {result:'warn',message:'The user cancelled using the dex.'}
                    }
                }
            }
            if(typeof networkRPC!=='undefined' && typeof account!=='undefined' && typeof currencyCode!=='undefined' && typeof currencyHex!=='undefined' && typeof issuerAddress!=='undefined')
            {
                return {result:'success',message:'Successfully initialized the dex config.',networkRPC,account,currencyCode,currencyHex,issuerAddress,isInICMode}
            }
            else return {result:'warn',message:'There was a problem initializing the dex config.'}
        }
        catch(err)
        {
            console.log('There was a problem loading the dex config.',err)
        }
}