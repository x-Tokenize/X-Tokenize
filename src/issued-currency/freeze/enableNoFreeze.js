import { importantMessage, infoMessage, errorMessage,warningMessage ,askYesNo} from "../../utils/index.js"
import { modifyAccountSettings,isSettingEnabled } from "../../xrpl/index.js"
import { configHandler } from "../../config/configHandler.js"


 /**
 * @function enableNoFreeze
 * @description
 * This function is responsible for enabling the lsfNoFreeze setting on the issuer's account. It first
 * checks if the setting is already enabled, and if not, it prompts the user for confirmation before proceeding with the
 * irreversible action. If the user confirms, the function modifies the account settings to enable lsfNoFreeze and
 * returns a success message. If there is an error during the process, it returns a failure message.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the operation.
 * @throws {Error} - If there is a problem enabling no freeze, an error is thrown with a description of the issue.
 */

export const enableNoFreeze = async()=>{
        try{
            let currentConfig = await configHandler.getConfigs()
            let {issuer,networkRPC,}=currentConfig.IC
            let checkNoFreezeResponse = await isSettingEnabled(networkRPC,issuer.address,'lsfNoFreeze')
            if(checkNoFreezeResponse.result ==='success' && checkNoFreezeResponse.isEnabled ===true) return {result:'warn',message:'The account setting lsfNoFreeze is already enabled. '}
            else
            {
                let txOptions = {verify:true,verbose:true,txMessage:null,askConfirmation:true}
                // txOptions.txMessage = `Enabling lsfNoFreeze`
                importantMessage(`Enabling no freeze is irreversible and will permenantly give up the ability to freeze/unfreeze issued currencies issued by this account.`)
                errorMessage(`THIS ACTION IS IRREVERSIBLE!`)
                warningMessage(`If there is an active global freeze, it will be permenantly enabled.`)
                warningMessage(`If there are existing frozen lines, they will be permanently frozen.`)
                if(!await askYesNo(`Do you wish to continue?`,false)) return {result:'warn',message:`User cancelled enabling lsfNoFreeze.`}
                else {
                    if(!await askYesNo(`Are you really sure you wish to continue?`,false)) return {result:'warn',message:`User cancelled enabling lsfNoFreeze.`}
                    else {
                        let accountSetResult = await modifyAccountSettings(networkRPC,issuer,{noFreeze:true},txOptions)
                        if(accountSetResult.result !=='success') return {result:'failed', message:`There was a problem enabling lsfNoFreeze.`}
                        else return {result:'success',message:`lsfNoFreeze was enabled successfully.`}
                    }
                }
                
            }   
        }
        catch(err)
        {
            console.log('There was a problem enabling no freeze:',err)
        }
}