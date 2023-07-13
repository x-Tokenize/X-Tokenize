import { configHandler } from "../../config/configHandler.js"
import { infoMessage, printBanner, pressAnyKey, askYesNo, printResponse } from "../../utils/index.js"
import { isNFTokenMintReady } from "./isNFTokenMintReady.js"
import { mintNFTokens } from "./mintNFTokens.js"
import { getWalletFromEncryptedSeed } from "../../xrpl/index.js"
import xrpl from "xrpl"

 /**
 * @function runNFTokenMint
 * @description
 * This function is responsible for running the NFT mint process. It first checks the current
 * configuration and the status of the NFT mint. If the mint is not ready, it returns a warning message. If the mint is
 * ready, it prompts the user to confirm if they want to run the mint. If the user confirms, it retrieves the wallet to
 * be used for minting and proceeds to mint the NFTs. Finally, it returns the result of the minting process.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the minting process.
 * @throws {Error} - If there is a problem running the mint, an error is thrown with a description of the issue.
 */
export const runNFTokenMint = async()=>{
        try{
            printBanner()
            let currentConfig = configHandler.getConfigs();
            let {NFT,NFT_MINT} = currentConfig
            let {network,networkRPC,minter,authorizedMinting,authorizedMinter} = NFT
            let {status,items} = NFT_MINT
            if(status==='completed') return {result:'warn',message:'The NFT mint has already been completed.'}
            else if(status==='pendingVerification') return {result:'warn',message:'The NFT mint is pending verification. Go back and verify the mint before attempting to run it again.'}
            else
            {
                let mintReady = await isNFTokenMintReady(network,networkRPC,minter,authorizedMinting,authorizedMinter,items)
                if(!mintReady) return {result:'warn',message:'Mint is not ready.'}
                else
                {
                    infoMessage(`Mint is ready to run!`)
                    await pressAnyKey()
                    let runMint = await askYesNo(`Would you like to run the mint?`)
                    if(runMint)
                    {
                        let walletToMintWith = authorizedMinting?authorizedMinter:minter
                        let wallet = walletToMintWith.seedEncrypted?await getWalletFromEncryptedSeed(walletToMintWith.address,walletToMintWith.seed):xrpl.Wallet.fromSeed(walletToMintWith.seed)
                        let mintResults = await mintNFTokens(wallet);
                        printResponse(mintResults)
                        console.log()
                        if(mintResults.result ==='success') return {result:'success',message:'The NFT mint was successful.'}
                        else return {result:'warn',message:'The NFT mint was not successful.'}
                    }
                    else return {result:'warn',message:'User declined to run the mint.'}
                }
            }
        }
        catch(err)
        {
            console.log('There was a problem running the mint:',err)
        }
}