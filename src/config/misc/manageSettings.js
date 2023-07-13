import { configHandler } from "../configHandler.js"
import { printBanner,infoMessage, warningMessage,askWhichFromList,askYesNo, askForTextInput,askForNumberMinMax,askQuestion, handleSeedEncryptionDecryption, pressAnyKey, errorMessage } from "../../utils/index.js"
import { askForConfigWallet } from "./askForConfigWallet.js"
import { askForNetworkConfigurations } from "./askForNetworkConfigurations.js"
import { handleXummAccountSetUp } from "../../xrpl/wallets/handleWalletPreference.js"
import { initializeXummSDK } from "../../xrpl/xumm/getXummSdk.js"

/**
 * @function manageSettings
 * @description
 * This function allows the user to manage the X-Tokenize settings such as the default project, the throttle, 
 * the txs_before_sleep, the sleep time, the max fee, the fee cushion, the max ledger offset, and the transaction logging.
 * 
 * @param {string} type - The type of configuration (NFT, IC, or default).
 * @returns {OperationResult} - An object containing the result and a message describing the result.
 * @throws {Error} - If there is a problem getting the accounts related to the current config.
 */
export const manageSettings = async()=>{
    try
    {
        printBanner() 
        let settings = configHandler.getConfigs('XTOKENIZE_SETTINGS')
        let options = ['Change Default Project',`Modify Xumm Settings`,`Change throttle`, `Change txs_before_sleep`, `Change sleep time`, `Change max_fee`,'Change fee_cushion','Change max_ledger_offset','Toggle transaction logging', `Adjust network options`, `Change funding Account`, `Add Account`, `Remove Accounts`, `Cancel`]
        warningMessage(`X-Tokenize will close after modifying settings. Please restart the application to apply changes.`)

        let choice = await askWhichFromList(`Which setting would you like to change?`,options)
        if(choice === 'Cancel') return {result:'warn',message:'Settings management cancelled.'}
        else
        {
            switch(choice)
            {
                case 'Change Default Project':
                {
                    infoMessage(`Changing the default project will automatically boot into that projects management menu when the application starts.`)
                    warningMessage(`Current Default Project: ${settings.config_type} - ${settings.config_name}`)
                    let configType = await askWhichFromList(`Which config type would you like to set?`,[`IC`,'NFT','Remove Default Project','Cancel'])
                    if(configType === 'Cancel') return {result:'warn',message:'Settings management cancelled.'}
                    else if(configType === 'Remove Default Project')
                    {
                        settings.config_type=''
                        settings.config_name=''
                        configHandler.XTOKENIZE_SETTINGS.set(settings)
                        return {result:'success',message:'Settings managed successfully.'}
                    }
                    else
                    {
                        let configs = await configHandler.getConfigs(configType)
                        let names = Object.keys(configs)
                        if(names.length === 0) return {result:'warn',message:`There are no ${configType} configs to choose from.`}
                        else
                        {
                            names.push('Cancel')
                            let configName = await askWhichFromList(`Which config would you like to set as default?`,names)
                            if(configName === 'Cancel')  return {result:'warn',message:'Settings management cancelled.'}
                            else
                            {
                                settings.config_type=configType
                                settings.config_name=configName
                                configHandler.XTOKENIZE_SETTINGS.set(settings)
                                return {result:'success',message:'Settings managed successfully.'}
                            }
                        }
                    }
                }
                case 'Modify Xumm Settings':
                    {
                        printBanner()
                        warningMessage(`XUMM integration will only work with one device at a time to use another device visit 'Refresh Xumm Device' in the settings.`)
                        infoMessage(`Xumm Settings provide two ways use XUMM with X-Tokenize:\n`)
                        warningMessage(`1. X-Tokenize API Key with Access Token:`)
                        infoMessage(`This method uses the X-Tokenize API Keys to generate an access token. This access token is then used to make requests to the Xumm API.`)
                        infoMessage(`With this method, you will not need to configure XUMM but, will need to refresh access every 24 hrs.\n`)
                        warningMessage(`2. Xumm Custom API Keys (advanced):`)
                        infoMessage(`This method allows you to use your own Xumm API Keys directly to make requests to the Xumm API. \n`)
                        warningMessage(`Current Xumm Settings`)
                        infoMessage(`TYPE: ${settings.xumm.type}`)
                        settings.xumm.type==='API_KEYS'?infoMessage(`KEY: ${settings.xumm.key} \t SECRET:${settings.xumm.secret} \t SECRET ENCRYPTED: ${settings.xumm.secretEncrypted}`):null

                        if(await askYesNo(`Would you to switch the XUMM Type?`))
                        {
                            let type = settings.xumm.type==='ACCESS_TOKEN'?'API_KEYS':'ACCESS_TOKEN'
                            if(type==='ACCESS_TOKEN')
                            {
                                settings.xumm.type = "ACCESS_TOKEN"
                                settings.xumm.key = '8c7f9263-64f9-484e-a967-7129281f9da9'
                                settings.xumm.secret = ""
                                settings.xumm.secretEncrypted = false
                                settings.xumm.token = ""
                                settings.xumm.expires = 0
                            }
                            else
                            {
                                let key = await askForTextInput(`What is the Xumm API Key?`)
                                let secret = await askForTextInput(`What is the Xumm API Secret?`)
                                let encryptedResult = await handleSeedEncryptionDecryption(secret,false)
                                settings.xumm.type = "API_KEYS"
                                settings.xumm.key = key
                                settings.xumm.secret = encryptedResult.seed
                                settings.xumm.secretEncrypted = encryptedResult.seedEncrypted
                                settings.xumm.token = ""
                                settings.xumm.expires = 0
                            }

                             configHandler.XTOKENIZE_SETTINGS.set(settings)
                             settings = configHandler.getConfigs('XTOKENIZE_SETTINGS')
                             let currentConfig = configHandler.getConfigs()
                             currentConfig.XTOKENIZE_SETTINGS = settings
                             await configHandler.updateCurrentConfig(currentConfig)
                             
                             infoMessage(`Please log in with any account on XUMM to refresh your ${type==='ACCESS_TOKEN'?'access token':'user token'}`)
                             if(type ==='ACCESS_TOKEN') await initializeXummSDK()
                             else 
                             {
                                let signInResult = await handleXummAccountSetUp(true)
                                if(signInResult.result !=='success')
                                {
                                    errorMessage(`Failed to configure XUMM with API_KEYS. Switching back to Access Token.`)
                                    settings.xumm.type = "ACCESS_TOKEN"
                                    settings.xumm.key = '8c7f9263-64f9-484e-a967-7129281f9da9'
                                    settings.xumm.secret = ""
                                    settings.xumm.secretEncrypted = false
                                    settings.xumm.token = ""
                                    settings.xumm.expires = 0
                                }
                                else
                                {
                                    settings.xumm.token = signInResult.user
                                    let now = new Date().getTime()
                                    let expires = 86400*30*1000
                                    settings.xumm.expires = now+expires
                                }
                                configHandler.XTOKENIZE_SETTINGS.set(settings)
                             }
                             return {result:'success',message:'Settings managed successfully.'}
                        }
                        else return {result:'warn',message:'Settings management cancelled.'}
                    }
                case 'Change throttle':
                {
                    infoMessage(`It is a good idea to throttle the bulk operations to avoid overloading the network.`)
                    warningMessage(`Setting this to 0 can cause you to be rate limited by the network. (If you are using public nodes)`)
                    warningMessage(`Current Setting:${settings.throttle}`)
                    let throttle = await askForNumberMinMax(`What would you like to set the throttle to (ms)?`,0,10000)
                    settings.throttle = Number(throttle)
                    configHandler.XTOKENIZE_SETTINGS.set(settings)
                    return {result:'success',message:'Settings managed successfully.'}
                }
                case 'Change txs_before_sleep':
                {
                    infoMessage(`It is a good idea to sleep the program after a certain number of transactions to avoid overloading the network.`)
                    warningMessage(`Setting this to 0 can cause you to be rate limited by the network. (If you are using public nodes)`)
                    warningMessage(`Current Setting:${settings.txs_before_sleep}`)
                    let txs_before_sleep = await askForNumberMinMax(`After how many transactions would you like to take a rest?`,0,1000)
                    settings.txs_before_sleep = Number(txs_before_sleep)
                    configHandler.XTOKENIZE_SETTINGS.set(settings)
                    return {result:'success',message:'Settings managed successfully.'}
                }
                case 'Change sleep time':
                {
                    infoMessage(`When the txs_before_sleep limit is reached, the program will sleep for a certain amount of time.`)
                    warningMessage(`Current Setting:${settings.sleep_time}`)
                    let sleep_time = await askForNumberMinMax(`How long would you like to sleep for? (Default is 90000)`,0,100000000)
                    settings.sleep_time = Number(sleep_time)
                    configHandler.XTOKENIZE_SETTINGS.set(settings)
                    return {result:'success',message:'Settings managed successfully.'}
                }
                case 'Change max_fee':
                {
                    infoMessage(`When the network load is high, fees can spike to 1000 drops or more.`)
                    infoMessage(`Setting a max fee will prevent the program from submitting transactions with a fee higher than the max fee.`)
                    warningMessage(`Current Setting:${settings.max_fee}`)
                    let max_fee = await askForNumberMinMax(`What would you like to set the max fee to? (Default is 100 drops)`,0,1000000)
                    settings.max_fee = Number(max_fee)
                    configHandler.XTOKENIZE_SETTINGS.set(settings)
                    return {result:'success',message:'Settings managed successfully.'}
                }
                
                case 'Change fee_cushion':
                    {
                        infoMessage(`The fee cushion is used when autofilling transactions with the fee.`)
                        infoMessage(`If the networkload is high, applying a fee cushion will help but not guarantee that your transactions will go through.`)
                        infoMessage(`Fees are calculated as such:`)
                        console.log(`fee=(base_fee*load_factor)*fee_cushion`)
                        infoMessage(`If the base fee is 10 drops, the load factor is 2, and the fee cushion is 1.2, the fee will be: 24 drops`)
                        warningMessage(`Current Setting:${settings.fee_cushion}`)
                        let fee_cushion = await askForNumberMinMax(`What would you like to set the fee cushion to? (Default is 1.2)`,1,2)
                        settings.fee_cushion = Number(fee_cushion)
                        configHandler.XTOKENIZE_SETTINGS.set(settings)
                        return {result:'success',message:'Settings managed successfully.'}
                    }
                case 'Change max_ledger_offset':
                    {
                        infoMessage(`When sending transactions, the max ledger offset is used to determine how many ledgers from the current ledger the transaction can be included in.`)
                        infoMessage(`This is useful if you are sending transactions to a node that is not synced.`)
                        warningMessage(`Current Setting: ${settings.max_ledger_offset}`)
                        let max_ledger_offset = await askForNumberMinMax(`What would you like to set the max ledger offset to? (Default is 20)`,0,100)
                        settings.max_ledger_offset = Number(max_ledger_offset)
                        configHandler.XTOKENIZE_SETTINGS.set(settings)
                        return {result:'success',message:'Settings managed successfully.'}
                    }
                case 'Toggle transaction logging':
                    {
                        infoMessage(`Transaction logging is used to keep track of transactions that have been sent accross all projects and tools and networks.`)
                        warningMessage(`Current Setting: ${settings.log_transactions}`)
                        if(await askYesNo(`Would you like to ${settings.log_transactions===true?`turn off`:`turn on`} transaction logging?`,true)) 
                        {
                            settings.log_transactions = !settings.log_transactions;
                            configHandler.XTOKENIZE_SETTINGS.set(settings)
                        }
                            return {result:'success',message:'Settings managed successfully.'}
                    }
                case 'Adjust network options':
                    {
                        let networkOptions = await askForNetworkConfigurations()
                        if(networkOptions.result==='success'){
                            settings.network = networkOptions.network
                            settings.networkRPC = networkOptions.rpc
                            configHandler.XTOKENIZE_SETTINGS.set(settings)
                            return {result:'success',message:'Settings managed successfully.'}
                        }
                        else return {result:'warn',message:'Settings management cancelled.'}
                    }
                case 'Change funding Account':
                    {
                        infoMessage(`You can use this account to fund new accounts.`)
                        infoMessage(`This is particulary useful is you are using altnets.`)
                        let addFundingAccount = false;
                        if(settings.funding_account!== null)
                        {
                            warningMessage(`Current funding account: ${settings.funding_account.address}`)
                            if(await askYesNo(`You are about to overwrite the existing funding account... Continue?`,true)) addFundingAccount=true 
                            else return {result:'warn',message:'Settings management cancelled.'}
                        }
                        else addFundingAccount = true
                        if(addFundingAccount)
                        {
                            let wallet = await askForConfigWallet(settings.network)
                            if(wallet.result === 'success'){
                                settings = configHandler.getConfigs(`XTOKENIZE_SETTINGS`)
                                settings.funding_account = wallet.wallet
                                configHandler.XTOKENIZE_SETTINGS.set(settings)

                                return {result:'success',message:'Settings managed successfully.'} 
                            }
                            else return {result:'warn',message:'Failed to add funding account.'}
                        }else return {result:'warn',message:'Settings management cancelled.'}
                        break
                    }
                case 'Add Account':
                    {
                        infoMessage(`You can add multiple account to the settings which you can add to different projects.`)
                        infoMessage(`You can also use these account with the tools or to interact with the DEX.`)
                        if(await askYesNo(`Would you like to add an account?`,true))
                        {    
                            let existingNames = settings.accounts.map((account)=>{return account.name})
                            let name = await askQuestion({type:'input',message:`Please enter a name for this account:`,validate:(value)=>{
                                if(existingNames.includes(value)) return `An account with this name already exists.`
                                else return true
                            }})
                            let wallet = await askForConfigWallet(settings.network)
                            if(wallet.result === 'success'){
                                wallet.wallet.name = name
                                settings = configHandler.getConfigs(`XTOKENIZE_SETTINGS`)
                                settings.accounts.push(wallet.wallet)
                                configHandler.XTOKENIZE_SETTINGS.set(settings)

                                return {result:'success',message:'Settings managed successfully.'}  
                            }
                            else return {result:'warn',message:'Failed to add account.'}
                        }else return {result:'warn',message:'Settings management cancelled.'}
                        break
                    }
                case 'Remove Accounts':
                    {
                        infoMessage(`You can remove accounts from the settings.`)
                        if(settings.accounts.length===0) return {result:'warn',message:'There are no accounts to remove.'}
                        else
                        {
                            let choices = settings.accounts.map((account)=>{return account.name})
                            let answer = await askQuestion({type:'list',message:`Which account would you like to remove?`,choices:choices})
                            if(await askYesNo(`Are you sure you want to remove ${answer}?`,true))
                            {
                                settings.accounts = settings.accounts.filter((account)=>{return account.name!==answer})
                                configHandler.XTOKENIZE_SETTINGS.set(settings)
                                return {result:'success',message:'Settings managed successfully.'}  
                            }
                            else return {result:'warn',message:'Settings management cancelled.'}
                        }
                    }
            }
        }
    }
    catch(err)
    {
        console.log("There was a problem managing the settings: ",err)
    }
}