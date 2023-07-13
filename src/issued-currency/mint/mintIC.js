import {configHandler}  from '../../config/configHandler.js'
import { isICMintReady } from './isICMintReady.js';
import {printBanner, askForNumberMinMax, printResponse} from '../../utils/index.js'
import { sendIssuedCurrency, getIssuedCurrencyCirculatingSupply} from '../../xrpl/index.js';


/**
 * @function mintIC
 * @description
 * This function is responsible for minting new issued currency tokens. It first retrieves the current
 * configuration, checks if the issued currency is mint-ready, and then calculates the maximum amount of tokens that can
 * be minted. The user is prompted to enter the desired mint amount, and if the amount is valid, the function sends the
 * issued currency to the treasury address. If the minting is successful, the circulating supply is updated and the new
 * configuration is saved.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the minting process.
 * @throws {Error} - If there is a problem during the minting process, an error is thrown and logged.
 */

export const mintIC = async()=>{
        try
        {
            printBanner();
            let currentConfig= await configHandler.getConfigs()
            let {network,networkRPC,issuer,treasury,currencyHex,currencyCode} = currentConfig.IC
            let isMintReady = await isICMintReady(network,networkRPC,issuer,treasury,currencyHex)
            if(!isMintReady) return {result:'warn',message:'The IC is not mint ready.'}
            else
            {   
                let circulatingSupply, max
                max = currentConfig.IC.fixedSupply?currentConfig.IC.totalSupply:Number.MAX_SAFE_INTEGER;
                let circulatingSupplyResponse = await getIssuedCurrencyCirculatingSupply(networkRPC,issuer.address,currencyHex)
                if(circulatingSupplyResponse.result==='success') circulatingSupply = circulatingSupplyResponse.circulatingSupply
                else  circulatingSupply = 0
                
                let maxToMint = Number(max) - Number(circulatingSupply)
                let mintAmount = await askForNumberMinMax(`How much $${currentConfig.IC.currencyCode} do you want to mint?(0: Cancel | Max:${maxToMint})`,0,maxToMint)
                if(mintAmount==="0") return {result:'warn',message:'The IC minting was cancelled.'}
                else
                {
                    let txOptions = {verify:true,verbose:true,txMessage:null,askConfirmation:true}
                    let mintResponse = await sendIssuedCurrency(networkRPC,issuer,treasury.address,currencyCode,{currency:currencyHex,issuer:issuer.address,value:mintAmount.toString()},txOptions)
                    printResponse(mintResponse)
                    if(mintResponse.result==='success')
                    {
                        let newCirculatingSupply = Number(circulatingSupply) + Number(mintAmount)
                        currentConfig.IC.circulatingSupply = newCirculatingSupply
                        await configHandler.updateCurrentConfig(currentConfig)
                        return {result:'success',message:`Successfully minted ${mintAmount} $${currencyCode}`}
                    } 
                    else return {result:'warn',message:'The IC minting failed.'}
                }
            }
        }
        catch(err)
        {
            console.log('There was a problem minting the issued currency:',err)
        }
}