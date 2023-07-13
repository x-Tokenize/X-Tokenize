import { askWalletPreference,handleWalletPreference } from "../../xrpl/index.js"
import { warningMessage } from "../../utils/index.js"

/**
 * @function askForConfigWallet
 * @description
 * This function prompts the user to select a wallet preference, handles the selected preference, and
 * returns the wallet configuration. It also displays a warning message if the user is working on the mainnet and
 * chooses to create a new wallet or import an existing wallet from seed.
 * 
 * @param {Network} network - The network the user is currently connected to.
 * @returns {ConfigWalletCreationResult} - An object containing the result, message, and (if successful) the created wallet.
 * @throws {Error} - If there is a problem getting the wallet configurations.
 */
export const askForConfigWallet = async(network)=>{
    try{
        let walletPreference = await askWalletPreference()
        if(walletPreference==='Cancel') return {result:'warn',message:'No wallet selected'}
        network==='mainnet' && (walletPreference ==='Create New Wallet' || walletPreference === 'Import Existing Wallet from seed') ?warningMessage('Looks like you are working on the mainnet. It is also highly advised that you encrypt your seed phrase'):null
        let wallet = await handleWalletPreference(walletPreference)
        if(!wallet) return {result:'warn',message:'No wallet selected'}
        else return {result:'success',message:'Wallet configurations set',wallet:wallet}
    }
    catch(err)
    {
        console.log('There was a problem getting the wallet configurations: ',err)
    }
}