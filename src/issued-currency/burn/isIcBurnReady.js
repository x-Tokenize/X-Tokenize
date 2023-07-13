import { infoMessage,printResponse } from "../../utils/index.js"
import { checkAccountExists,getSpecificTrustline } from "../../xrpl/index.js"

 /**
 * @function isIcBurnReady
 * @description
 * This function checks if the treasury account is ready for burning the issued currency. It first checks
 * if the treasury account exists on the network, then checks the balance of the treasury account, and finally checks if
 * the treasury account has a trustline to the issued currency. If all conditions are met, it returns the balance of the
 * issued currency in the treasury account.
 * 
 * @param {string} network - The network to be used (e.g., 'mainnet' or 'testnet').
 * @param {string} networkRPC - The RPC URL of the network.
 * @param {object} treasury - The treasury account object containing the address.
 * @param {string} currencyCode - The currency code of the issued currency.
 * @param {string} currencyHex - The currency code in hexadecimal format.
 * @param {string} issuerAddress - The address of the issuer account.
 * @returns {ICBurnReadyResult} - An object containing the result , a message, and the balance of the issued currency in the treasury account (if applicable).
 * @throws {Error} - If there is a problem burning the issued currency.
 */
export const isIcBurnReady = async(network,networkRPC,treasury,currencyCode,currencyHex,issuerAddress)=>{
    try
    {
        let treasuryChecked,trustlineChecked= false
        infoMessage(`Checking if the treasury account exists on the network...`)
        treasuryChecked = await checkAccountExists(network,networkRPC,treasury.address)
        printResponse(treasuryChecked)
        console.log()

        if(treasuryChecked.result==='success')
        {
                infoMessage(`Checking balance of the treasury...`)
                trustlineChecked = await getSpecificTrustline(networkRPC,currencyHex,issuerAddress,treasury.address)
                printResponse(trustlineChecked)
                console.log()
                if(trustlineChecked.result==='success')
                {
                let {trustline}= trustlineChecked
                if(Number(trustline.balance)>0) return {result:'success',message:`The treasury account has a balance of ${trustline.balance} $${currencyCode}.`,balance:trustline.balance}
                else return {result:'warn',message:'The treasury account does not have a balance of the issued currency.'}
                }
                else return {result:'warn',message:'The treasury account does not have a trustline to the issued currency.'}
        }
        else return {result:'warn',message:'The treasury account does not exist on the network.'}
    }
    catch(err)
    {
        console.log('There was a problem burning the issued currency:',err)
    }
}