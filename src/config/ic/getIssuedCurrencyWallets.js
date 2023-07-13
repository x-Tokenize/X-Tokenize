import {printBanner,infoMessage,warningMessage} from '../../utils/index.js'
import { askForConfigWallet } from '../misc/askForConfigWallet.js'
import { handleWalletPreference } from '../../xrpl/index.js'

/**
 * @function getIssuedCurrencyWallets
 * @description
 * This function is responsible for guiding the user through the process of setting up the issuer,
 * treasury, and operational wallets for managing issued currency on the XRPL. It prompts the user with information
 * about each wallet's purpose and asks them to either create a new wallet or import an existing one. The function
 * returns an object containing the created or imported wallets for the issuer, treasury, and operational accounts.
 * 
 * @param {string} network - The network to be used for the wallet configurations (either 'mainnet' or 'testnet').
 * @returns {IssuedCurrencyWalletCreationResult} -An object containing the result, message and (if successful) the created wallets.
 * @throws Will throw an error if there is a problem getting the issued currency wallet configurations.
 */
export const getIssuedCurrencyWallets = async(network)=>{
    try{
        printBanner()
        console.log()
        infoMessage('The issuer wallet is the xrpl account that will be used to issue and manage the issued currency.')
        infoMessage('This will also be the wallet where users will set their trustlines for the issued currency.')
        let issuerWalletCreation = await askForConfigWallet(network)
        if(issuerWalletCreation.result==='warn') return {result:'warn',message:'No issuer wallet selected'}
        else
        {
            console.log()
            infoMessage('The treasury wallet is the xrpl account that will be used to hold the issued currency.')
            let treasuryWalletCreation = await askForConfigWallet(network)
            if(treasuryWalletCreation.result==='warn') return {result:'warn',message:'No treasury wallet selected'}     
            else
            {
                console.log()
                infoMessage('The operational wallet will be used to execute distributions and manage orders on the DEX.')
                warningMessage('Unlike the previous wallets, the operational wallet must act as a hot wallet that will be stored within this configuration.')
                let operationalWallet = await handleWalletPreference('Create New Wallet')
                return {result:'success',message:'Wallet configurations set',issuer:issuerWalletCreation.wallet,treasury:treasuryWalletCreation.wallet,operational:operationalWallet}
            }
        }
    }
    catch(err)
    {
        console.log('There was a problem getting the issued currency wallet configs: ',err)
    }
}