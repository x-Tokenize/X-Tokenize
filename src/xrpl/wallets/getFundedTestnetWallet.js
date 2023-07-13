import axios from 'axios'
import {successMessage, wait, warningMessage } from '../../utils/index.js'

 /**
 * @function getFundedTestnetWallet
 * @description
 * This function retrieves a funded testnet wallet from the XRPL Testnet Faucet. It sends a POST request
 * to the faucet's API and processes the response. If the response contains a valid wallet, it formats the account data
 * and returns it. If there's an error or timeout, the function retries after a 20-second wait.
 * 
 * @param {boolean} verbose - Determines whether to display success and warning messages.
 * @returns {Promise<Object>} - An object containing the result status, a message, and the formatted account data if successful.
 * @throws {Error} - Throws an error if there's a problem getting a funded testnet wallet.
 */
export const getFundedTestnetWallet = async(verbose)=>{
        try{
            let walletResponse = await axios.post('https://faucet.altnet.rippletest.net/accounts')
            if(walletResponse.data.error) return {result:'warn',message:walletResponse.data.error}
            else if(walletResponse.status===200 && walletResponse.data.account)
            {
                let account = walletResponse.data.account;
                let formattedAccount = {
                    address:account.address,
                    seed:account.secret,
                }
                if(verbose) successMessage(`Successfully got a funded testnet wallet: ${formattedAccount.address}`)
                 return {result:'success',message:'Successfully got a funded testnet wallet.',account:formattedAccount}
            }
            else
            {
                 return {result:'warn',message:'There was a problem getting a funded testnet wallet.'}
            }
        }
        catch(err)
        {
            if(err.code ==='ETIMEDOUT')
            {
                if(verbose) warningMessage(`There was a problem getting a funded testnet wallet... Waiting 20 seconds and trying again.`)
                await wait(20000)
                return await getFundedTestnetWallet(verbose)
                
            }
            else console.log('There was a problem getting a funded testnet wallet:',err)
            // console.log('There was a problem getting a funded testnet wallet:',err)
        }
}