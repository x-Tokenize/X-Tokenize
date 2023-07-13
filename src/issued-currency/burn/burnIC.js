import {configHandler}  from "../../config/configHandler.js"
import { isIcBurnReady } from "./isIcBurnReady.js"
import { askForNumberMinMax, printResponse } from "../../utils/index.js"
import {sendIssuedCurrency,getIssuedCurrencyCirculatingSupply} from "../../xrpl/index.js"


 /**
 * @function burnIC
 * @description
 * This function is responsible for burning a specified amount of issued currency (IC) from the treasury
 * account. It first retrieves the current configuration, checks if the IC is ready to be burned, and then prompts the
 * user to enter the amount they want to burn. If the user chooses to proceed, the function sends the issued currency to
 * the issuer account, effectively burning it. The circulating supply is then updated in the configuration.
 * 
 * @returns {OperationResult} - An object containing the result of the operation and a message describing the outcome.
 * @throws {Error} - If there is a problem burning the issued currency.
 */
export const burnIC = async()=>{
        try{
            let currentConfig= await configHandler.getConfigs()
            let {network,networkRPC,issuer,treasury,currencyHex,currencyCode} = currentConfig.IC

            let burnReady = await isIcBurnReady(network,networkRPC,treasury,currencyCode,currencyHex,issuer.address)
            printResponse(burnReady)
            console.log()
            if(burnReady.result ==='success')
            {
                let circulatingSupply
                let maxBurnable = burnReady.balance
                let circulatingSupplyResponse = await getIssuedCurrencyCirculatingSupply(networkRPC,issuer.address,currencyHex)
                if(circulatingSupplyResponse.result==='success') circulatingSupply = circulatingSupplyResponse.circulatingSupply
                else circulatingSupply = currentConfig.IC.circulatingSupply

                let burnAmount = await askForNumberMinMax(`How much of the issued currency do you want to burn? (0: Cancel | Max:${maxBurnable})`,0,maxBurnable)
                if(burnAmount==="0") return {result:'warn',message:'The IC burn was cancelled.'}
                else
                {
                    let txOptions = {verify:true,verbose:true,txMessage:null,askConfirmation:true}
                    let burnResponse = await sendIssuedCurrency(networkRPC,treasury,issuer.address,currencyCode,{currency:currencyHex,issuer:issuer.address,value:burnAmount.toString()},txOptions)
                    printResponse(burnResponse)
                    if(burnResponse.result==='success')
                    {
                        let newCirculatingSupply = Number(circulatingSupply) - Number(burnAmount)
                        currentConfig.IC.circulatingSupply = newCirculatingSupply
                        await configHandler.updateCurrentConfig(currentConfig)
                        return {result:'success',message:`Successfully burned ${burnAmount} $${currencyCode}`}
                    } 
                    else return {result:'warn',message:'The IC burning failed.'}
                }
            }

        }
        catch(err)
        {
            console.log('There was a problem burning the issued currency:',err)
        }
}