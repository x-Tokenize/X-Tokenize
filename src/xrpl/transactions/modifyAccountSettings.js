import { askYesNo, fancyMessage, infoMessage,printResponse,warningMessage,successMessage} from '../../utils/index.js'
import {transactionHandler} from '../core/transactionHandler.js'
import { isSettingEnabled } from '../data/isSettingEnabled.js'
import pkg from 'crypto-js'
const { MD5 } = pkg
import xrpl from 'xrpl'

 /**
 * @function explainSetting
 * @description
 * Provides a detailed description of the specified account setting. The function prints a warning message
 * with the description of the setting.
 * 
 * @param {string} setting - The account setting for which the description is required.
 */
export const explainSetting = (setting) => {
    switch (setting) {
        case 'Domain':
            warningMessage(`The domain setting is a string that can be used to identify a specific account.\nIt is not used by the XRP Ledger itself, but it can be used by other systems that rely on the XRP Ledger.`)
            break;
        case 'EmailHash':
            warningMessage(`The email hash is used to generate an avatar image for the account using gravatar.`)
            break;
        case 'TickSize':
            warningMessage(`The tick size determines the smallest increment in which currencies issued by this account can be traded on the DEX. \n Example: Tick Size 3 would result in orders having to be placed increments of 0.001 XRP.`)
            break;
        case 'TransferRate':
            warningMessage(`The transfer rate is used to determine the fee that is charged when a currency issued by this account is sent to another account.`)
            break;
        case 'RegularKey':
            warningMessage(`Setting a regular key on the account allows for transactions to be signed utilizing that key instead of the master key.`)
            break;
        case 'lsfDefaultRipple':
            warningMessage('Default rippling automatically enables all issued currencies that are issued by an account to be transacted by their holders.')
            break;
        case 'lsfDisallowXRP':
            warningMessage(`Disallow incoming XRP let's other accounts know that you do not wish to accept XRP on this account although it is not enforced by the ledger.`)
            break;
        case 'lsfRequireDestTag':
            warningMessage(`Require destination tag enforces that all incoming transactions to this account must have a destination tag.`)
            break;
        case 'lsfRequireAuth':
            warningMessage(`Require authorization enforces all trustlines to be authorized prior to holding balances.`)
            break;
        case 'lsfDisableMaster':
            warningMessage(`Disabling the master key prevents the master key from being used to sign transactions.`)
            break;
        default :
            fancyMessage(`Description for ${setting} is not available.`)
    }
}

/**
 * @function modifyAccountSettings
 * @description
 * Modifies the account settings of the specified account on the XRPL. The function takes in the account
 * settings options and transaction options, and modifies the account settings accordingly. It also handles various
 * flags and settings, and provides verbose output if required.
 * 
 * @param {string} networkRPC - The network RPC URL to connect to the XRPL.
 * @param {object} account - The account object containing the account address.
 * @param {object} accountSetOptions - The options for modifying the account settings.
 * @param {object} txOptions - The transaction options for modifying the account settings.
 * @returns {Promise<Object>} - An object containing the result and message of the modification process.
 * @throws {Error} - If there is a problem modifying the account settings.
 */
export const modifyAccountSettings = async (networkRPC, account, accountSetOptions,txOptions) => {
        try{
            let {
                domain,
                emailHash,
                messageKey,
                transferRate,
                tickSize,
                regularKey,
                disallowIncomingXRP,
                noFreeze,
                enableGlobalFreeze,
                clearGlobalFreeze,
                requireAuth,
                requireDestTag,
                disableMaster,
                depositAuth,
                defaultRipple,
                authorizedNFTokenMinter,
                accountTxID,
                additionalValues} = accountSetOptions
            let {verbose,}=txOptions

            txOptions.txMessage=`Modifying account settings for ${account.address}`
            let tx = {"TransactionType":"AccountSet","Account":account.address,Flags:''}
            let setting
            if(domain)
            {
                setting = 'Domain'
                tx.Domain = xrpl.convertStringToHex(additionalValues.domain)
                txOptions.txMessage = txOptions.txMessage + `\n with domain ${domain}`
            }
            if(emailHash)
            {
                setting= 'EmailHash'
                tx.EmailHash = MD5(additionalValues.emailHash).toString().toUpperCase()
                txOptions.txMessage = txOptions.txMessage + `\n with the has of the email ${emailHash}`
            }
            if(tickSize)
            {
                setting = 'TickSize'
                tx.TickSize = additionalValues.tickSize
                txOptions.txMessage = txOptions.txMessage + `\n with tick size ${tickSize}`
            }
            if(transferRate)
            {
                setting = 'TransferRate'
                tx.TransferRate = xrpl.percentToTransferRate(additionalValues.transferRate.toString())
                txOptions.txMessage = txOptions.txMessage + `\n with transfer rate ${transferRate}`
            }
            if(regularKey)
            {
                tx.TransactionType = 'SetRegularKey'
                tx.RegularKey = additionalValues.regularKey
                setting = 'RegularKey'
                txOptions.txMessage = txOptions.txMessage + `\n with regular key ${additionalValues.regularKey}`
            }
            if(noFreeze)
            {
                setting = 'lsfNoFreeze'
                tx.SetFlag=(xrpl.AccountSetAsfFlags.asfNoFreeze)
                txOptions.txMessage = txOptions.txMessage + '\n with no freeze flag enabled'
            }
            if(enableGlobalFreeze)
            {
                setting = 'lsfGlobalFreeze'
                tx.SetFlag=(xrpl.AccountSetAsfFlags.asfGlobalFreeze)
                txOptions.txMessage = txOptions.txMessage + '\n with global freeze flag enabled'
            }
            if(clearGlobalFreeze)
            {
                setting = 'lsfGlobalFreeze'
                tx.ClearFlag = (xrpl.AccountSetAsfFlags.asfGlobalFreeze)
                txOptions.txMessage = txOptions.txMessage + '\n with global freeze flag disabled'
            }
            if(requireAuth)
            {
                setting = 'lsfRequireAuth'
                tx.SetFlag=(xrpl.AccountSetAsfFlags.asfRequireAuth)
                txOptions.txMessage = txOptions.txMessage + '\n with require auth flag enabled'
            }
            // if(requireDestTag)
            // {
            //     setting = 'lsfRequireDestTag'
            //     tx.SetFlag=(xrpl.AccountSetAsfFlags.asfRequireDestTag)
            //     txOptions.txMessage = txOptions.txMessage + '\n with require destination tag flag enabled'
            // }
            if(disableMaster)
            {
                setting = 'lsfDisableMaster'
                tx.SetFlag=(xrpl.AccountSetAsfFlags.asfDisableMaster)
                txOptions.txMessage = txOptions.txMessage + '\n with disable master flag enabled'
            }
            if(depositAuth)
            {
                setting = 'lsfDepositAuth'
                tx.SetFlag=(xrpl.AccountSetAsfFlags.asfDepositAuth)
                txOptions.txMessage = txOptions.txMessage + '\n with deposit auth flag enabled'
            }
            if(defaultRipple !== undefined)
            {
                setting = 'lsfDefaultRipple'
                defaultRipple===true?tx.SetFlag=(xrpl.AccountSetAsfFlags.asfDefaultRipple):tx.ClearFlag=(xrpl.AccountSetAsfFlags.asfDefaultRipple)
                txOptions.txMessage = txOptions.txMessage + `\n with default ripple flag ${defaultRipple===true?'enabled':'disabled'}`
            }
            if(disallowIncomingXRP!==undefined){
                setting = 'lsfDisallowXRP'
                disallowIncomingXRP?tx.SetFlag=(xrpl.AccountSetAsfFlags.asfDisallowXRP):tx.ClearFlag=(xrpl.AccountSetAsfFlags.asfDisallowXRP)
                txOptions.txMessage = txOptions.txMessage + `\n with disallow incoming XRP flag ${disallowIncomingXRP?'enabled':'disabled'}`
            }
            if(requireDestTag !== undefined)
            {
                setting = 'lsfRequireDestTag'
                requireDestTag?tx.SetFlag=(xrpl.AccountSetAsfFlags.asfRequireDest):tx.ClearFlag=(xrpl.AccountSetAsfFlags.asfRequireDest)
                txOptions.txMessage = txOptions.txMessage + `\n with require destination tag flag ${requireDestTag?'enabled':'disabled'}`
            }
            if(authorizedNFTokenMinter)
            {
                setting = 'lsfAuthorizedNFTokenMinter'
                tx.SetFlag=(xrpl.AccountSetAsfFlags.asfAuthorizedNFTokenMinter)
                tx.NFTokenMinter=additionalValues.NFTokenMinter
                txOptions.txMessage = txOptions.txMessage + '\n with authorize non fungible token minter flag enabled'
            }
            if(accountTxID)
            {
                setting = 'lsfAccountTxnID'
                tx.SetFlag=(xrpl.AccountSetAsfFlags.asfAccountTxnID)
                txOptions.txMessage = txOptions.txMessage + '\n with account transaction ID flag enabled'
            }

                
                verbose?explainSetting(setting):null
            
                txOptions.txMessage=`Modifying ${setting} account setting for ${account.address}`
                let txResult = await transactionHandler(networkRPC,tx,account,txOptions)
                if(txResult.result === 'success')
                {
                     if(verbose) successMessage(`The account settings have been modified.`)
                    let checkSettingEnabled = await isSettingEnabled(networkRPC,account.address,setting)
                    if(checkSettingEnabled.result ==='success')
                    {
                        if(tx[setting] !=='undefined') return {result:'success',message:`The account setting ${setting} has been modified.`}
                        if(tx.SetFlag !=='undefined' && checkSettingEnabled.isEnabled===true) return {result:'success',message:`The account setting ${setting} has been enabled.`}
                        if(tx.ClearFlag !=='undefined' && checkSettingEnabled.isEnabled===false) return {result:'success',message:`The account setting ${setting} has been disabled.`}

                    }
                    if(tx.SetFlag!==undefined && checkSettingEnabled.isEnabled===true)
                    return checkSettingEnabled
                }
                else 
                {
                    if(verbose)  printResponse(txResult)
                    return {result:'warn',message:`The account settings have not been modified.`}
                }
        
        }
        catch(err)
        {
            console.log('There was a problem modifying the account settings:',err)
        }

}