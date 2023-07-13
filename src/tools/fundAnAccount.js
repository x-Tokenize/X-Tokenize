import { configHandler } from "../config/configHandler.js";
import { askForAddress } from "../utils/index.js";
import { handleUnfundedAccount } from "../xrpl/index.js";

 /**
 * @function fundAnAccount
 * @description
 * This function is responsible for funding an account on the XRPL. It retrieves the current configuration
 * settings, prompts the user to provide the address of the account they would like to fund, and then calls the
 * handleUnfundedAccount function to fund the account.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the funding process.
 * @throws {Error} - If there is a problem funding the account, an error message will be logged to the console.
 */

export const fundAnAccount = async()=>{
    try
    {
        let currentConfig = configHandler.getConfigs();
        let settings = currentConfig.XTOKENIZE_SETTINGS;
        let {network,networkRPC} = settings;
        let address = await askForAddress(`Please provide the address of the account you would like to fund:`)
        if(address ==='0') return {result:'warn',message:`User cancelled funding the account.`}
        else return await handleUnfundedAccount(network,networkRPC,address)

    }
    catch(err)
    {
        console.log(`There was a problem funding an account.`)
    }
}