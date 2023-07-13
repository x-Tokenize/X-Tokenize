import { configHandler } from "../configHandler.js";
import { getAllTrustlinesToAnIssuer } from "../../xrpl/index.js";
import { icDistributionElligibility } from "../../issued-currency/index.js";
import { infoMessage,warningMessage,successMessage, printBanner, pressAnyKey, askYesNo } from "../../utils/index.js";

/**
 * @function createIssuedCurrencyDistributionConfig
 * @description
 * This function creates a configuration object for an Issued Currency Distribution. It retrieves the
 * current configuration, filters trustlines,
 * calculates the distribution amount, and prompts the user to review and confirm the configuration. If
 * confirmed, the function returns the
 * configuration object.
 * 
 * @param {string} distributionName - The name of the distribution configuration.
 * @returns {ConfigCreationResult} -  An object containing the result, message and (if successful) the created IC distribution config.
 * @throws {Error} - If there is a problem creating the configuration.
 */
export const createIssuedCurrencyDistributionConfig = async(distributionName)=>{
    try{
        let currentConfig = await configHandler.getConfigs();
        let {networkRPC,operational,currencyCode,currencyHex,issuer,treasury} = currentConfig.IC
       
        let ICDConfig ={
            name:distributionName,
            projectName:configHandler.getCurrentProjectName(),
            status:'created',
            timeCreated:new Date().toISOString(),
            numElligibleLines: 0,
            amount: '0',
            totalToDistribute:'0',
            currencyCode:currencyCode,
            currencyHex:currencyHex,
            distributionWallet:operational,
            ledgerIndexStart : null,
            ledgerIndexEnd : null,
            successfulDistributions:0,
            failedDistributions:0,
            lines:[],
        }

        let {lines} = await getAllTrustlinesToAnIssuer(networkRPC,issuer.address)
        lines = lines.filter(line=>(line.account!==issuer.address && line.account!==treasury.address && line.account !== operational.address))
        lines = lines.filter(line=>(Number(line.quality_in)>=Number(line.quality_out)))
        lines = lines.filter(line=>(line.currency ===currencyHex  || line.currency ===currencyCode))
        let filteredLinesResult = await icDistributionElligibility(networkRPC,lines)

        if(filteredLinesResult.result==='warn') return {result:'warn',message:filteredLinesResult.message}
        else if(filteredLinesResult.result==='success')
        {
            successMessage(filteredLinesResult.message)
            await pressAnyKey()
            printBanner()
            ICDConfig.numElligibleLines = filteredLinesResult.lines.length
            ICDConfig.amount= filteredLinesResult.distributionAmount
            ICDConfig.totalToDistribute=filteredLinesResult.lines.reduce((line)=>Number(line.amount),0)
            infoMessage(`Please review the following configuration:`)
            console.log(ICDConfig)
            warningMessage(`Note: Trustlines have been omited from the above configuration for brevity.`)
            warningMessage(`Instead, the number of lines to be distributed are shown.`)
            let confirm = await askYesNo('Is this correct?',true)
            if(confirm)
            {
                ICDConfig.lines = filteredLinesResult.lines
                return {result:'success',message:'Issued currency distribution configuration created',config:ICDConfig}
            }
            else return {result:'warn',message:'Issued currency distribution configuration not created'}
        }    
    }
    catch(err)
    {
        console.log('There was a problem creating the config: ',err)
    }
}