import {askYesNo,infoMessage} from '../../utils/index.js'
import {askForNetworkConfigurations} from '../misc/askForNetworkConfigurations.js'
import { getICCurrencyConfig } from './getICCurrencyConfig.js'
import {getIssuedCurrencyWallets} from './getIssuedCurrencyWallets.js'

/**
 * @function createIssuedCurrencyConfig
 * @description
 * This function creates an issued currency configuration object by prompting the user for various inputs
 * such as network configurations, wallet configurations, and currency configurations. The function then returns the
 * created configuration object or a warning message if there was an issue during the process.
 * 
 * @param {string} name - The name of the issued currency configuration.
 * @returns {ConfigCreationResult} - An object containing the result, message and (if successful) the created IC config.
 * @throws {Error} - If there is a problem during the configuration creation process.
 */
export const createIssuedCurrencyConfig = async(name)=>{
    try
    {
        let ICConfig = {
            name:name,
            network:'',
            networkRPC:'',
            issuer:{},
            treasury:{},
            operational:{},
            currencyCode:'',
            currencyHex:'',
            fixedSupply:false,
            totalSupply:0,
            circulatingSupply:0,
        }
        let networkConfigs = await askForNetworkConfigurations()
        if(networkConfigs.result==='warn') return {result:'warn',message:networkConfigs.message}
        else
        {
            ICConfig.network = networkConfigs.network
            ICConfig.networkRPC = networkConfigs.rpc

            let walletConfigs = await getIssuedCurrencyWallets(ICConfig.network)
            if(walletConfigs.result==='warn') return {result:'warn',message:walletConfigs.message}
            else
            {
                ICConfig.issuer = walletConfigs.issuer
                ICConfig.treasury = walletConfigs.treasury
                ICConfig.operational = walletConfigs.operational
  
                let currencyConfigs = await getICCurrencyConfig()
                if(currencyConfigs.result==='warn') return {result:'warn',message:currencyConfigs.message}
                else
                {
                    ICConfig.currencyCode = currencyConfigs.currencyCode
                    ICConfig.currencyHex = currencyConfigs.currencyHex
                    ICConfig.fixedSupply = currencyConfigs.fixedSupply
                    ICConfig.totalSupply = currencyConfigs.totalSupply
                    ICConfig.circulatingSupply = currencyConfigs.circulatingSupply
                    ICConfig.isMinted = currencyConfigs.isMinted
                
                    infoMessage(`Please review the following configuration:`)
                    console.log(ICConfig)
                    let confirm = await askYesNo('Is this correct?',true)
                    if(confirm) return {result:'success',message:'Issued currency configuration created',config:ICConfig}
                    else if(await askYesNo('Would you like to try again?',true)) return await createIssuedCurrencyConfig(name)
                    else return {result:'warn',message:'No issued currency configuration created'}
                }
            }
        }
    }
    catch(err)
    {
        console.log('There was a problem creating the config: ',err)
    }
}

                // if(ICConfig.network ==='mainnet')
                // {
                //     importantMessage('PLEASE CREATE AN OFFLINE BACK UP OF THESE SEEDS IMMEDIATELY. IF YOU LOSE ACCESS TO THESE SEEDS, YOU WILL LOSE ACCESS TO YOUR FUNDS.')
                //     errorMessage('IF YOU STORE THESE UNENCRYPTED AND YOUR COMPUTER AND IT IS COMPROMISED, YOU WILL LOSE ACCESS TO YOUR FUNDS.')
                //     errorMessage('NEVER SHARE THESE SEEDS WITH ANYONE.')
                //     errorMessage('NEVER STORE THESE SEEDS ON A PUBLICLY ACCESSIBLE SERVER.')
                //     errorMessage('NEVER STORE THESE SEEDS ON A PUBLICLY ACCESSIBLE CLOUD STORAGE SERVICE.')
                //     errorMessage(`DON'T TAKE A PICTURE OF THESE. IF YOU LOSE YOUR PHONE, YOU WILL LOSE ACCESS TO YOUR FUNDS.`)
                //     warningMessage('By continuing, you acknowledge that you have taken the necessary steps to secure your seed phrases.')
                //     await pressAnyKey()
                //     infoMessage(`Are you sure?`)
                //     await pressAnyKey()
                // }  