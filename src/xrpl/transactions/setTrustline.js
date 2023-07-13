import {askYesNo, errorMessage, infoMessage,printResponse} from "../../utils/index.js"
import { getSpecificTrustline } from "../data/getSpecificTrustline.js"
import { transactionHandler } from "../core/transactionHandler.js"
import xrpl from 'xrpl'

export const didTrustSetFlagSet = (trustline,flag)=>{
    ///TO DO CHECK IF THE FLAG IS SET OR CLEARED
}

/**
 * @function setTrustline
 * @description
 * Sets a trustline between the trustee account and the issuer for a specific currency. The trustline can
 * have various options such as limit amount, quality in, quality out, and different flags (authorize, setNoRipple,
 * clearNoRipple, setFreeze, clearFreeze).
 * 
 * @param {string} networkRPC - The network RPC URL to connect to the XRPL.
 * @param {string} issuerAddress - The address of the issuer of the currency.
 * @param {string} currencyHex - The currency code in hexadecimal format.
 * @param {object} trusteeAccount - The account object of the trustee.
 * @param {object} trustlineOptions - The options for the trustline, including limitAmount, qualityIn,
 * qualityOut, and flags (authorize, setNoRipple, clearNoRipple, setFreeze, clearFreeze).
 * @param {object} txOptions - The transaction options, including verbose and txMessage.
 * @returns {Promise<Object>} - Returns the result of the trustline operation, either the updated trustline or a warning message.
 * @throws {Error} - Throws an error if there is a problem setting the trustline.
 */
export const setTrustline= async(networkRPC,issuerAddress,currencyHex,trusteeAccount,trustlineOptions,txOptions)=>{
        try{
            let {verbose} = txOptions
            const maxSupply = "999999999999999900000000000000000000000000000000000000000000000000000000000000000000000000000000"
            let {limitAmount,qualityIn,qualityOut,authorize,setNoRipple,clearNoRipple,setFreeze,clearFreeze} = trustlineOptions
            let tx = {
                "TransactionType":"TrustSet",
                "Account":trusteeAccount.address,
                "LimitAmount":
                    {
                        "currency":currencyHex,
                        "issuer":issuerAddress,
                        "value":limitAmount?limitAmount:maxSupply,
                    },
                "QualityIn":qualityIn?qualityIn:0,
                "QualityOut":qualityOut?qualityOut:0,
                "Flags":''
                }
            txOptions.txMessage =`Setting trustline for ${trusteeAccount.address} to ${issuerAddress} for ${currencyHex}`

            if(authorize){
                tx.Flags=(xrpl.TrustSetFlags.tfSetfAuth); 
                txOptions.txMessage = txOptions.txMessage + ' \nwith authorization flag enabled'
            }
            if(setNoRipple) 
            {
                tx.Flags=(xrpl.TrustSetFlags.tfSetNoRipple); 
                txOptions.txMessage = txOptions.txMessage + '\n with no ripple flag enabled'
            }
            if(clearNoRipple){
                tx.Flags=(xrpl.TrustSetFlags.tfClearNoRipple); 
                txOptions.txMessage = txOptions.txMessage + '\n with clear no ripple flag enabled'
            } 
            if(setFreeze) {
                tx.Flags=(xrpl.TrustSetFlags.tfSetFreeze); 
                txOptions.txMessage = txOptions.txMessage + '\n with set freeze flag enabled'

            }
            if(clearFreeze) {
                tx.Flags=(xrpl.TrustSetFlags.tfClearFreeze); 
                txOptions.txMessage = txOptions.txMessage + '\n with clear freeze flag enabled'
            }
            
           
            let txResult = await transactionHandler(networkRPC,tx,trusteeAccount,txOptions)
            if(txResult.result === 'success')
            {
                let checkTrustline = await getSpecificTrustline(networkRPC,currencyHex,issuerAddress,trusteeAccount.address)
                return checkTrustline
            }
            else 
            {
                if(verbose)  printResponse(txResult)
                return {result:'warn',message:`The trustline has not been set.`}
            }
              
        }
        catch(err)
        {
            console.log('There was a problem setting the trustline:',err)
        }
}