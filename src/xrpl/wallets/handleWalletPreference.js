
import xrpl from 'xrpl'
import keypairs from 'ripple-keypairs'
import { successMessage,askForTextInput, askWhichFromList, printResponse, infoMessage, printQR, askYesNo, printBanner} from "../../utils/index.js"
import {  handleSeedEncryptionDecryption } from "../../utils/helpers/handleSeedEncryptionDecryption.js"
import {xummSignIn} from '../xumm/index.js'

import  {selectWalletFromLedgerDevice} from './ledger.js'

 /**
 * @function askWalletPreference
 * @description
 * Prompts the user to select a wallet preference from a list of options. The options include creating a
 * new wallet, importing an existing wallet from seed, using an external wallet (XUMM or Ledger Nano S/X), or canceling
 * the operation.
 * 
 * @returns {Promise<string>} - The selected wallet preference.
 * @throws {Error} - If there is an error during the process.
 */
export const askWalletPreference = async()=>{
    try{
        let preference = await askWhichFromList('Please select a wallet preference:',['Create New Wallet','Import Existing Wallet from seed','Use External Wallet (XUMM or Ledger Nano S/X)','cancel'])
        return preference
    }catch(err)
    {
        console.log(err);
    }
}

/**
 * @function handleXummAccountSetUp
 * @description
 * Handles the XUMM account setup process by signing in the user and displaying the result. If the sign-in
 * process is not successful, the user is prompted to try again or cancel the operation.
 * 
 * @returns {Promise<Object>} - An object containing the result of the XUMM account setup process, a message, and
 * additional data if the process was successful.
 * @throws {Error} - If there is an error during the process.
 */
export const handleXummAccountSetUp = async(refreshToken)=>{
    try
    {
        let signInResult = await xummSignIn(refreshToken)
        printResponse(signInResult)
        if(signInResult.result !== 'success')
        {
            if(await askYesNo(`Would you like to try again?`,true)) return await handleXummAccountSetUp(refreshToken)
            else return {result:'warn', message:`There was a problem signing in with XUMM. Please try again.`}    
        } 
        else return {result:'success', message:`Successfully signed in with XUMM.`, address:signInResult.address, user:signInResult.user}
    }
    catch(err)
    {
        console.log('There was a problem handling the Xumm account set up.')
        console.log(err)
    }
}

/**
 * @function handleWalletPreference
 * @description
 * Handles the selected wallet preference by performing the corresponding action, such as creating a new
 * wallet, importing an existing wallet from seed, or using an external wallet (XUMM or Ledger Nano S/X). Returns an
 * object containing the wallet information or false if the operation is canceled.
 * 
 * @param {string} preference - The selected wallet preference.
 * @returns {Promise<Object|boolean>} - An object containing the wallet information or false if the
 * operation is canceled.
 * @throws {Error} - If there is an error during the process.
 */
export const handleWalletPreference = async(preference)=>{
    try{
        let encryptionResult

        switch(preference)
        {
            case 'Create New Wallet':
                let created = xrpl.Wallet.fromSecret(keypairs.generateSeed())
                successMessage('Success generating Wallet!')
                console.log('Generated Wallet: ',created)
                
                if(created.seed)
                {
                    encryptionResult = await handleSeedEncryptionDecryption(created.seed,false)
                    return {
                        address:created.classicAddress,
                        seed:encryptionResult.seed,
                        seedEncrypted:encryptionResult.seedEncrypted
                    }
                }
                break;
                
            case 'Import Existing Wallet from seed':
                let seed = await askForTextInput('Please provide the account seed:')//await askQuestion({type:'input',message:'Please provide the account seed:'})
                let imported = xrpl.Wallet.fromSeed(seed)
                successMessage('Success generating Wallet!')
                console.log('Generated Wallet: ',imported)
                if (imported.seed)
                {
                    encryptionResult = await handleSeedEncryptionDecryption(imported.seed,false)
                    return {
                        address:imported.classicAddress,
                        seed:encryptionResult.seed,
                        seedEncrypted:encryptionResult.seedEncrypted
                    }
                }
                break;
            case 'Use External Wallet (XUMM or Ledger Nano S/X)':
                let walletPreference = await askWhichFromList('Which wallet would you like to use?',['XUMM','Ledger Nano S/X','Cancel'])
                switch(walletPreference)
                {
                    case 'XUMM':
                        let xummAccountResponse = await handleXummAccountSetUp()
                        printResponse(xummAccountResponse)
                        if(xummAccountResponse.result !== 'success')return false
                        else
                        {
                            let {address,user} = xummAccountResponse
                            return {address:address,seed:'N/A',seedEncrypted:false,externalWallet:'XUMM'}
                        }
                    case 'Ledger Nano S/X':
                        let selectLedgerAddressResponse = await selectWalletFromLedgerDevice()
                        printResponse(selectLedgerAddressResponse)
                        if(selectLedgerAddressResponse.result !== 'success') return false
                        else
                        {
                            let {address,path,publicKey} = selectLedgerAddressResponse
                            return {address:address,seed:'N/A',seedEncrypted:false,externalWallet:'Ledger Nano S/X',path:path,publicKey:publicKey}
                        }
                       
                    case 'Cancel':
                        return await handleWalletPreference(preference)
                }
            case 'cancel':
                return false
                
        }
    }catch(err)
    {
        console.log(err);
    }
}