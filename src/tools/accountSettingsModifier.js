import { askForNumberMinMax, askForTextInput, askWhichFromList, askYesNo, errorMessage, fancyMessage, importantMessage, infoMessage, pressAnyKey, printBanner, printResponse, warningMessage } from "../utils/index.js";
import { checkAccountExists, getAccountInfo, modifyAccountSettings } from "../xrpl/index.js";
import {parseAccountRootFlags} from 'xrpl'
import { selectAConfigAccountWithNetwork } from "../utils/helpers/ask.js";

/**
 * @function manageAccountSettings
 * @description
 * This function manages the account settings of a given account on the XRPL. It provides a menu for the
 * user to select various account settings options, such as setting domain, email hash, authorized minter, tick size,
 * transfer rate, regular key, message key, toggling default ripple, disallowing XRP, destination tags, and blackholing
 * the account. The function then executes the selected option and returns the result.
 * 
 * @param {object} account - The account object containing the address and secret.
 * @param {string} networkRPC - The network RPC URL.
 * @param {string} network - The network name (e.g., 'mainnet', 'testnet').
 * @returns {OperationResult} - An object containing the result and a message describing the operation.
 * @throws {Error} - If there's an error managing the account settings.
 */
export const manageAccountSettings= async(account,networkRPC,network)=>{
    try
    {
        printBanner()
        //let accountInfoResponse = await getAccountInfo(networkRPC,account.address)
        let accountInfoResponse = await checkAccountExists(network,networkRPC,account.address)
        if(accountInfoResponse.result!=='success') return accountInfoResponse
        else
        {
            let accountInfo = accountInfoResponse.account_data
            let flags = parseAccountRootFlags(accountInfo.Flags)

            let options = [
                `Set Domain`,
                `Set Email Hash`, 
                `Set Authorized Minter`, 
                `Set Tick Size`,
                `Set Transfer Rate`, 
                `Set Regular Key`, 
                `Set Message Key`,
                `Toggle Default Ripple`,
                `Toggle Disallow XRP`,  
                `Toggle Destination Tags`,
                // `Manage Multi-Sig`,
                `Manage Trustline Authorization`,
                `Manage Deposit Authorization`,
                `BLACKHOLE`,
                `Cancel`
            ]
            infoMessage(`${account.address} Account Settings:`)
            console.log(accountInfo)
            infoMessage(`Account Flags: `)
            console.log(JSON.stringify(flags,null,2))

            let txOptions ={verify:true,verbose:true,txMessage:``,askConfirmation:true}
            let settingSelection = await askWhichFromList(`How would you like to manage account settings?`,options)
            if(settingSelection==='Cancel') return{result:'warn',message:`User cancelled account settings selection.`}
            else
            {
                let result
                switch(settingSelection)
                {
                    case 'Set Domain':
                        {
                            
                            let domain = await askForTextInput(`What domain would you like to set for the account (0:Cancel)? `)
                            if(domain==='0') return manageAccountSettings(account,networkRPC,network)
                            else result = await modifyAccountSettings(networkRPC,account,{domain:true,additionalValues:{domain:domain}},txOptions)
                            break;
                        }
                    case 'Set Email Hash':
                        {
                            let emailHash = await askForTextInput(`What email hash would you like to set for the account (0:Cancel)?`)
                            if(emailHash==='0') return manageAccountSettings(account,networkRPC,network)
                            else result = await modifyAccountSettings(networkRPC,account,{emailHash:true,additionalValues:{emailHash:emailHash}},txOptions)
                            break;
                        }
                    case 'Set Authorized Minter':
                        {
                            let authorizedMinter = await askForTextInput(`Please provide the address for the authorized minter (0:Cancel): `)
                            if(authorizedMinter==='0') return manageAccountSettings(account,networkRPC,network)
                            else result = await modifyAccountSettings(networkRPC,account,{authorizedNFTokenMinter:true,additionalValues:{NFTokenMinter:authorizedMinter}},txOptions)
                            break;
                        }
                    case 'Set Tick Size':
                        {
                            let tickSize = await askForNumberMinMax(`What tick size would you like to set for the account (-1:Cancel)(0: Disable)(MIN:3)(MAX:15)? `,-1,15)
                            if(Number(tickSize)===-1) return manageAccountSettings(account,networkRPC,network)
                            else if(Number(tickSize)>0 && Number(tickSize)<3){
                                warningMessage(`Tick size must be 3 or higher.`)
                                await pressAnyKey()
                                return manageAccountSettings(account,networkRPC,network)
                            }
                            else result = await modifyAccountSettings(networkRPC,account,{tickSize:true,additionalValues:{tickSize:Number(tickSize)}},txOptions)
                            break;
                        }
                    case 'Set Transfer Rate':
                        {
                            let transferRate = await askForNumberMinMax(`What transfer rate % would you like to set for the account (-1:Cancel) (MIN:0,MAX:100)? `,-1,100)
                            if(Number(transferRate)==='-1') return manageAccountSettings(account,networkRPC,network)
                            else result = await modifyAccountSettings(networkRPC,account,{transferRate:true,additionalValues:{transferRate:transferRate+'%'}},txOptions)
                            break;
                        }
                    case 'Set Regular Key':
                        {
                            let regularKey = await askForTextInput(`Please provide the address for the regular key you would like to set (0:Cancel): `)
                            if(regularKey==='0') return manageAccountSettings(account,networkRPC,network)
                            else result = await modifyAccountSettings(networkRPC,account,{regularKey:true,additionalValues:{regularKey:regularKey}},txOptions)
                            break;

                        }
                    case 'Set Message Key':
                        {
                            fancyMessage(`Coming soon.`)
                            await pressAnyKey()
                            return manageAccountSettings(account,networkRPC,network)
                            break;
                            // let messageKey = await askForTextInput(`What message key would you like to set for the account (0:Cancel)? `)
                            // if(messageKey==='0') return manageAccountSettings(account,networkRPC,network)
                            // else{
                            //     //set message key
                            // }
                            break;
                        }
                    case 'Toggle Default Ripple':
                        {
                            let setting=await askYesNo(`Would you like to ${flags.lsfDefaultRipple?'disable':'enable'} default ripple?`)
                            if(!setting) return manageAccountSettings(account,networkRPC,network)
                            else result = await modifyAccountSettings(networkRPC,account,{defaultRipple:flags.lsfDefaultRipple?false:true},txOptions)
                            //toggle default ripple    
                            break;
                        
                        }
                    case 'Toggle Disallow XRP':
                        {
                            let setting=await askYesNo(`Would you like to ${flags.lsfDisallowXRP?'enable':'disable'} incoming XRP payments?`)
                            if(!setting) return manageAccountSettings(account,networkRPC,network)
                            else result = await modifyAccountSettings(networkRPC,account,{disallowIncomingXRP:flags.lsfDisallowXRP?false:true},txOptions)
                            //toggle default ripple    
                            break;
                        }
                    case 'Toggle Destination Tags':
                        {
                            let setting=await askYesNo(`Would you like to ${flags.lsfRequireDestTag?'disable':'enable'} destination tag requirements?`)
                            if(!setting) return manageAccountSettings(account,networkRPC,network)
                            else result = await modifyAccountSettings(networkRPC,account,{requireDestTag:flags.lsfRequireDestTag?false:true},txOptions)
                            //toggle require destination tags
                            break;
                        }
                    case 'Manage Multi-Sig':
                        {
                            fancyMessage(`Coming soon.`)
                            await pressAnyKey()
                            return manageAccountSettings(account,networkRPC,network)
                            break;
                        }
                    case 'Manage Trustline Authorization':
                        {
                            fancyMessage(`Coming soon.`)
                            await pressAnyKey()
                            return manageAccountSettings(account,networkRPC,network)
                            break;
                        }
                    case 'Manage Deposit Authorization':
                        {
                            fancyMessage(`Coming soon.`)
                            await pressAnyKey()
                            return manageAccountSettings(account,networkRPC,network)
                            break;
                        }
                    case 'BLACKHOLE':
                        {
                            importantMessage(`Black holing an account is permanent and will permanently revoke access to the account!`)
                            warningMessage(`This action cannot be undone. Please be sure you want to do this.`)
                            if(await askYesNo(`Are you sure you want to blackhole this account?`))
                            {
                                warningMessage(`All account settings, balances, trustline configurations, frozen lines, etc. Will be permanently set as they are now.`)
                                errorMessage(`This is your last warning...`)
                                await pressAnyKey()
                                if(await askYesNo(`Are you really really sure you want to do this?`))
                                {
                                    let regularKeySetResult = await modifyAccountSettings(networkRPC,account,{regularKey:true,additionalValues:{regularKey:"rrrrrrrrrrrrrrrrrrrrrhoLvTp"}},txOptions)
                                    if(regularKeySetResult.result!=='success') result =  regularKeySetResult
                                    else
                                    {
                                        result = await modifyAccountSettings(networkRPC,account,{disableMaster:true},txOptions)
                                    }
                                }
                                else return manageAccountSettings(account,networkRPC,network)

                            }
                            else return manageAccountSettings(account,networkRPC,network)
                            break;
                        }

                }
                printResponse(result)
                await pressAnyKey()
                return manageAccountSettings(account,networkRPC,network)

            }
        }
            

        
    }
    catch(err)
    {
        console.log('There was a problem managing the account settings: ',err)
    }
}

/**
 * @function accountSettingsModifier
 * @description
 * This function is the main entry point for modifying account settings on the XRPL. It prompts the user
 * to select an account and its associated network, then calls the manageAccountSettings function to handle the account
 * settings modification.
 * 
 * @param {string} config_type - The configuration type (e.g., 'issuing', 'operational', 'personal').
 * @returns {Promise<object>} - An object containing the result and message of the operation.
 * @throws {Error} - If there's an error modifying the account settings.
 */
export const accountSettingsModifier = async(config_type)=>{
    try
    {
        let selectAccountResult = await selectAConfigAccountWithNetwork(config_type)
        if(selectAccountResult.result!=='success') return selectAccountResult
        else
        {
            let {account,networkRPC,network} = selectAccountResult
            return await manageAccountSettings(account,networkRPC,network)
        }
    }
    catch(err)
    {
        console.log(`There was a problem modifying the account settings:`,err)
    }
}