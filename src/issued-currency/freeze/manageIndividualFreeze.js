import { configHandler } from "../../config/configHandler.js"
import { askWhichFromList, askYesNo, infoMessage, filterList } from "../../utils/index.js"
import { getAllTrustlinesToAnIssuer, isSettingEnabled, setTrustline } from "../../xrpl/index.js"

 /**
 * @function manageIndividualFreeze
 * @description
 * This function manages the freezing and unfreezing of individual trustlines for a specific issued
 * currency. It first checks if the lsfNoFreeze setting is enabled for the issuer account. If it is enabled, the
 * function returns a warning message. If not, it retrieves all trustlines to the issuer and filters them based on
 * whether they are frozen or unfrozen. The user is then prompted to choose an address to freeze or unfreeze, and the
 * trustline is updated accordingly.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the operation.
 * @throws {Error} - Throws an error if there is a problem managing individual freeze.
 */

export const manageIndividualFreeze = async()=>{
        try
        { 
            let currentConfig = await configHandler.getConfigs()
            let {currencyCode,currencyHex,issuer,networkRPC,}=currentConfig.IC
            let checkNoFreezeResponse = await isSettingEnabled(networkRPC,issuer.address,'lsfNoFreeze')
            if(checkNoFreezeResponse.result ==='success' && checkNoFreezeResponse.isEnabled ===true) return {result:'warn',message:'The account setting lsfNoFreeze is enabled. You cannot freeze individual accounts.'}
            else
            {
                let trustlineResponse = await getAllTrustlinesToAnIssuer(networkRPC,issuer.address)
                if(trustlineResponse.result === 'success')
                {
                    let lines = trustlineResponse.lines
                    let addresses=[]
                    let unfreeze = await askYesNo(`Are you attempting to unfreeze a line?`,true)
                    if(unfreeze)
                    {
                        lines.forEach(line=>{if(line.freeze && line.currency===currencyHex) addresses.push(line.account)})
                    }
                    else
                    {
                        lines.forEach(line=>{if(!line.freeze && line.currency===currencyHex) addresses.push(line.account)})
                        // infoMessage(`There are ${filtered.length} unfrozen lines.`)
                    }
                    
                    if(addresses.length===0) return {result:'warn',message:`There are no ${unfreeze?'frozen':'unfrozen'} lines to manage.`}
                    else
                    {
                        infoMessage(`Found ${addresses.length} ${unfreeze?'frozen':'unfrozen'} lines.`)
                        
                            
                        let filteredResult=await filterList(addresses,`Enter the first few characters of the address you want to ${unfreeze?'unfreeze':'freeze'} (Cancel:0).`)
                        if(filteredResult.result==='warn') return {result:'warn',message:'User cancelled the operation.'}
                        else 
                        {
                            addresses = filteredResult.filtered
                            let address = await askWhichFromList(`Which address do you want to ${unfreeze?'unfreeze':'freeze'}?`,addresses)
                            let trustlineOptions ={}
                            unfreeze?trustlineOptions.clearFreeze = true:trustlineOptions.setFreeze = true
                            let txOptions = {verify:true,verbose:true,txMessage:null,askConfirmation:true}
                            txOptions.txMessage = `${unfreeze?'Unfreezing':'Freezing'} ${address}`
                            let trustlineResult = await setTrustline(networkRPC,address,currencyHex,issuer,trustlineOptions,txOptions)
                            if(trustlineResult.result !=='success') return {result:'failed', message:`There was a problem ${unfreeze?'unfreezing':'freezing'} the trustline.`}
                            else return {result:'success',message:`The trustline to account ${address} for the currency${currencyCode} was ${unfreeze?'unfrozen':'frozen'} successfully.`}
                        }
                        
                    }
                }
                else
                {
                    return {result:'warn',message:'There was a problem retrieving the trustlines.'}
                }
                
            }
        }
        catch(err)
        {
            console.log('There was a problem managing individual freeze: ',err)
        }
}