import { askForNetworkConfigurations } from "../misc/askForNetworkConfigurations.js"
import { getNFTWallets } from "./getNFTWallets.js"
import { infoMessage, askYesNo,makeDirectory, } from "../../utils/index.js"


/**
 * @function createNFTConfig
 * @description
 * This function creates a new NFT configuration object by prompting the user for network configurations
 * and wallet configurations. It then asks the user to review and confirm the generated configuration. If the user
 * confirms, the function creates a new directory for the NFT metadata and returns the configuration object. If the user
 * declines, they can either try again or exit without creating a configuration.
 * 
 * @param {string} configName - The name of the NFT configuration.
 * @returns {ConfigCreationResult} - An object containing the result, message and (if successful) the created NFT config.
 * @throws {Error} - If there is a problem creating the config.
 */
export const createNFTConfig = async(configName)=>{
    try{
        let NFTConfig = {
            name:configName,
            network:"",
            networkRPC:"",
            minter:null,
            authorizedMinting:null,
            authorizedMinter:null,
        }
        let networkConfigs = await askForNetworkConfigurations()
        if(networkConfigs.result==='warn') return {result:'warn',message:networkConfigs.message}
        else
        {
            NFTConfig.network = networkConfigs.network
            NFTConfig.networkRPC = networkConfigs.rpc
        }

        let walletConfigs = await getNFTWallets(NFTConfig.network)
        if(walletConfigs.result==='warn') return {result:'warn',message:walletConfigs.message}
        else
        {
            NFTConfig.minter = walletConfigs.minter
            NFTConfig.authorizedMinting = walletConfigs.authorizedMinting
            NFTConfig.authorizedMinter = walletConfigs.authorizedMinter
        }

        infoMessage(`Please review the following configuration:`)
        console.log()
        console.log(NFTConfig)
        console.log()
        let confirm = await askYesNo('Is this correct?',true)
        if(confirm)
        {
            makeDirectory(`${process.cwd()}/nft-metadata/`)
            makeDirectory(`${process.cwd()}/nft-metadata/${NFTConfig.name}`)
            return {result:'success',message:'NFT configuration created',config:NFTConfig}
        }
        else if(await askYesNo('Would you like to try again?',true))
        {
            return await createNFTConfig(configName)
        }
        else
        {
            return {result:'warn',message:'No NFT configuration created'}
        }

    }
    catch(err)
    {
        console.log('There was a problem creating the config: ',err)
    }
}
