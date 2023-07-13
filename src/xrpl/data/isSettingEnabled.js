import {getAccountInfo} from './getAccountInfo.js'
import  {parseAccountRootFlags}  from 'xrpl'
import { printResponse } from '../../utils/index.js'

 /**
 * @function isSettingEnabled
 * @description
 * This function checks if a specific account setting is enabled or not for a given account address on the
 * XRPL. It fetches the account information using the getAccountInfo function and then parses the account root flags
 * using the parseAccountRootFlags function from the xrpl library. It returns an object containing the result status, a
 * message indicating whether the setting is enabled or not, and a boolean value representing the enabled status of the setting.
 * 
 * @param {string} networkRPC - The network RPC URL to connect to the XRPL.
 * @param {string} accountAddress - The account address for which the setting needs to be checked.
 * @param {string} setting - The account setting to be checked.
 * @returns {Promise<Object>} - An object containing the result status, a message indicating whether the setting is
 * enabled or not, and a boolean value representing the enabled status of the setting.
 * @throws {Error} - Throws an error if there is a problem checking if the account setting is enabled.
 */

export const isSettingEnabled = async(networkRPC,accountAddress,setting)=>{
        try{
            let accountInfoResponse= await getAccountInfo(networkRPC,accountAddress)
            if(accountInfoResponse.result === 'success')
            {
                let flags = parseAccountRootFlags(accountInfoResponse.account_data.Flags)
                return {result:'success',message:`The account setting ${setting} ${flags[setting]?'is':'is not'} enabled.`,isEnabled:flags[setting]?true:false}
            }
            else{
                printResponse(accountInfoResponse)
                return {result:'failed',message:`Failed to get account info`,isEnabled:false}
            }
        }
        catch(err)
        {
            console.log('There was a problem checking if the account setting is enabled:',err)
        }
}