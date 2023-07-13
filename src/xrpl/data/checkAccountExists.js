import { errorMessage, printResponse, successMessage, warningMessage } from "../../utils/index.js";
import { submitRequest } from "../core/requests.js";
import { handleUnfundedAccount } from "../wallets/handleUnfundedAccount.js";
import { getAccountInfo } from "./getAccountInfo.js";

/**
 * @function checkAccountExists
 * @description
 * This function checks if an account exists on the XRPL network. If the account does not exist, it
 * attempts to fund the account and then re-checks its existence. If the account exists, it returns the account
 * information. If there are any errors during the process, appropriate messages are printed and the function returns a
 * failed result.
 * 
 * @param {string} network - The network to be used (e.g., 'mainnet' or 'testnet').
 * @param {string} networkRPC - The RPC URL of the network.
 * @param {string} accountAddress - The account address to check for existence on the XRPL network.
 * @returns {Promise<Object>} - An object containing the result ('success', 'warn', or 'failed') and additional
 * information depending on the result.
 * @throws {Error} - Throws an error if there is a problem checking if the account exists.
 */
export const checkAccountExists = async (network,networkRPC,accountAddress) => {

        try 
        {
            let accountInfoResponse = await getAccountInfo(networkRPC,accountAddress)
            if(accountInfoResponse.result === 'success') return accountInfoResponse
            else if(accountInfoResponse.result === 'warn' && accountInfoResponse.code === 'actNotFound')
            {
                warningMessage(`The account does not exist on the XRPL network.`)
                let fundingResult = await handleUnfundedAccount(network,networkRPC,accountAddress)
                if(fundingResult.result==='success') return await checkAccountExists(network,networkRPC,accountAddress)
                else 
                {
                    printResponse(fundingResult)
                    return {result:'failed',message:'Failed to fund the account.'}
                }
       
            }
            else{
                printResponse(accountInfoResponse)
                return {result:'failed',message:'Failed to check if the account exists.'}
            } 
        }
        catch (err) {
            console.log('There was a problem checking if the account exists: ', err)
        }

}