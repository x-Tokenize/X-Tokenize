import { configHandler } from "../../config/configHandler.js"
import { askYesNo,fancyMessage,warningMessage,importantMessage,errorMessage, printResponse } from "../../utils/index.js"
import { isSettingEnabled,modifyAccountSettings} from "../../xrpl/index.js"

 /**
 * @function toggleGlobalFreeze
 * @description
 * Toggles the global freeze setting for an Issued Currency on the XRPL. This function checks the current
 * global freeze and no freeze settings of the issuer account, and based on user input, either enables or disables the
 * global freeze setting. If no freeze is enabled and global freeze is active, the setting cannot be changed. If no
 * freeze is enabled and global freeze is not active, the user is warned about the irreversible action of enacting a
 * global freeze. If global freeze is active, the user is prompted to disable it. If global freeze is not active, the
 * user is prompted to enable it.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the operation.
 * @throws {Error} - If there is a problem toggling the global freeze setting.
 */
export const toggleGlobalFreeze=async()=>{
        try{
            let currentConfig = await configHandler.getConfigs()
            let IC = currentConfig.IC
            let {networkRPC,issuer} = IC
            let checkNoFreeze = await isSettingEnabled(networkRPC,issuer.address,'lsfNoFreeze')
            let checkGlobalFreeze = await isSettingEnabled(networkRPC,issuer.address,'lsfGlobalFreeze')

            let noFreezeEnabled,globalFreezeEnabled
            
            if(checkGlobalFreeze.result ==='success' && checkNoFreeze.result ==='success')
            {
                let txOptions = {verify:true,verbose:true,txMessage:null,askConfirmation:true}
                globalFreezeEnabled = checkGlobalFreeze.isEnabled
                noFreezeEnabled = checkNoFreeze.isEnabled

                if(noFreezeEnabled && globalFreezeEnabled)
                {
                    warningMessage(`Global Freeze is active with no freeze enabled. Setting can not be changed.`)
                    return {result:'warn',message:`Global Freeze is active with no freeze enabled. Setting can not be changed.`}
                }
                else if (noFreezeEnabled && !globalFreezeEnabled)
                {
                        warningMessage(`It appears you have No-Freeze enabled on the issuer.`)
                        importantMessage(`Enacting a global freeze with no freeze enabled is irreversible and will permenantly halt ALL Issued Currencies issued by this account`)
                        errorMessage(`THIS ACTION IS IRREVERSIBLE!`)
                        if(await askYesNo(`Do you wish to continue?`,false))
                        {
                            let accountSetOptions = {enableGlobalFreeze:true}
                            let changingAccountSettingsResult = await modifyAccountSettings(networkRPC,issuer,accountSetOptions,txOptions)
                            if(changingAccountSettingsResult.result ==='success') return {result:'success',message:`Global freeze has been enacted.`}
                            else
                            {
                                printResponse(changingAccountSettingsResult)
                                return {result:'failed',message:`There was a problem enacting a global freeze.`}
                            }
                        }
                        else return {result:'warn',message:`User cancelled enacting a global freeze.`}
                }
                else if (globalFreezeEnabled)
                {
                    if(!await askYesNo(`You are about to disable the global freeze. Do you wish to continue?`,true)) return {result:'warn',message:`User declined to disable the global freeze.`}
                    else
                    {
                        let accountSetOptions = {clearGlobalFreeze:true}
                        let changingAccountSettingsResult = await modifyAccountSettings(networkRPC,issuer,accountSetOptions,txOptions)
                        if(changingAccountSettingsResult.result ==='success') return {result:'success',message:`Global freeze has been disabled.`}
                        else
                        {
                            printResponse(changingAccountSettingsResult)
                            return {result:'failed',message:`There was a problem disabling a global freeze.`}
                        }
                    }
                }
                else
                {
                    
                    if(!await askYesNo(`You are about to enable a global freeze. Do you wish to continue?`,true)) return {result:'warn',message:`User declined to enable the global freeze.`}
                    else
                    {
                        let accountSetOptions = {enableGlobalFreeze:true}
                        let changingAccountSettingsResult = await modifyAccountSettings(networkRPC,issuer,accountSetOptions,txOptions)
                        if(changingAccountSettingsResult.result ==='success') return {result:'success',message:`Global freeze has been enabled.`}
                        else
                        {
                            printResponse(changingAccountSettingsResult)
                            return {result:'failed',message:`There was a problem enabling a global freeze.`}
                        }
                    }
                }
            }
            else
            {
                if(checkGlobalFreeze.result !=='success') return {result:'failed',message:'There was a problem checking the global freeze setting.'}
                else if(checkNoFreeze.result !=='success') return {result:'failed',message:'There was a problem checking the global freeze setting.'}
                else return {result:'failed', message:'There was a problem checking the settings.'}
            }
        }
        catch(err)
        {
            console.log('There was a problem toggling the global freeze:',err)
        }
}