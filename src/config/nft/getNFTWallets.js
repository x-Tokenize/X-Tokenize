import { printBanner,infoMessage,warningMessage,askYesNo } from "../../utils/index.js"
import { handleWalletPreference } from "../../xrpl/index.js"
import { askForConfigWallet } from "../misc/askForConfigWallet.js"


/**
 * @function getNFTWallets
 * @description
 * This function is responsible for setting up the minting wallet for NFTokens. It prompts the user to
 * select a wallet for minting and optionally
 * configure authorized minting. If authorized minting is enabled, the function will also prompt the user to
 * create or select an authorized minter wallet.
 * 
 * @param {string} network - The network to be used for the wallet configuration (e.g. 'mainnet' or 'testnet').
 * @returns {Promise<Object>} - An object containing the result, message, minter, authorizedMinting, and
 * authorizedMinter properties.
 * @throws {Error} - Throws an error if there is a problem getting the issued currency wallet configurations.
 */
export const getNFTWallets = async(network)=>{
    try
    {
        printBanner()
        infoMessage(`Let's set up your minting wallet!`)
        infoMessage(`The NFTokens that are minted by this configuration will be issued from this wallet.`)
        warningMessage('If you are working on the mainnet, it is strongly advised to encrypt your wallet.')
        let mintingWallet, authorizedMinting, authorizedMinter

        mintingWallet = await askForConfigWallet(network)
        if(mintingWallet.result==='warn') return {result:'warn',message:'No minting wallet selected'}
        else
        {
            if(typeof mintingWallet.wallet.externalWallet !== 'undefined')
            {
                infoMessage(`It looks like you are using an external wallet for the minting account.`)
                warningMessage(`In order to bulk mint you will need to use an internal authorized minting account.`)
                infoMessage(`Authorized minting allows another account you control to mint NFTs on behalf of the minting wallet.`)
                if(await askYesNo(`Do you wish to continue by generating an authorized minting account?`,true))
                {
                    authorizedMinting = true
                    authorizedMinter = await handleWalletPreference('Create New Wallet')
                }
                else return {result:'warn',message:'No authorized minting account selected'}
            }
            else
            {
                infoMessage(`Authorized minting allows another account you control to mint NFTs on behalf of the minting wallet.`)
                authorizedMinting = await askYesNo(`Would you like to use authorized minting?`,true)
                authorizedMinter=null
                if(authorizedMinting)
                {
                    authorizedMinting = true
                    authorizedMinter = await handleWalletPreference('Create New Wallet')
                    if(authorizedMinter.result==='warn') return {result:'warn',message:'Failed to create authorized minter wallet'}
                }
                else  authorizedMinting = false
            }
        }
        return {result:'success',message:'Wallet configurations set',minter:mintingWallet.wallet,authorizedMinting:authorizedMinting,authorizedMinter:authorizedMinting?authorizedMinter:null}
    }
    catch(err)
    {
        console.log('There was a problem getting the issued currency wallet configs: ',err)
    }
}