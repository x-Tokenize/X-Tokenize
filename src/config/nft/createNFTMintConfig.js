import { configHandler } from "../configHandler.js"
import { infoMessage,askYesNo,printBanner,warningMessage,askForNumberMinMax } from "../../utils/index.js"

/**
 * @function createNFTMintConfig
 * @description
 * This function creates a new NFT mint configuration by performing the following steps:
 * 1. Prompt the user to select a metadata deployment to use for the mint.
 * 2. Filter the eligible items in the selected deployment and attach them to the mint configuration.
 * 3. Prompt the user to configure NFT settings such as transferability, transfer fee, trading
 * restrictions, burnability, and token taxon.
 * 4. Display the mint configuration to the user for confirmation.
 * 5. If the user confirms the configuration, update the current configuration with the new mint
 * configuration and return a success message along with the mint configuration.
 * 6. If the user cancels the configuration, offer the option to try again or return a warning message.
 * 7. If there is a problem creating the mint configuration, catch the error and display a message to the user.
 * 
 * @param {string} name - The name of the NFT mint configuration.
 * @returns {ConfigCreationResult} - An object containing the result, message and (if successful) the created NFT config.
 * @throws {Error} - If there is a problem creating the mint configuration.
 */
export const createNFTMintConfig = async(name)=>{
    try
    {
        let items=[]
        let transferable, transferFee,onlyXRP,burnable,tokenTaxon
        
        infoMessage(`Please select a metadata deployment to use for this mint.`)
        let selected = await configHandler.selectConfig('NFT_METADATA');
        if(selected.result==='warn') return  {result:'warn',message:'User cancelled mint creation.'}
        else
        {
            let currentConfig = configHandler.getConfigs()
            for(let i = 0; i<currentConfig.NFT_METADATA.items.length;i++)
            {
                let item = currentConfig.NFT_METADATA.items[i]
                if(item.status==='deployed' && item.uri!=="" && item.attachedToMint === false)
                {
                    currentConfig.NFT_METADATA.items[i].attachedToMint = true
                    currentConfig.NFT_METADATA.items[i].mintName = name
                    let itemToMint={
                        id:i,
                        file:item.file,
                        uri:item.uri,
                        status:'pending',
                        minted:false,
                        attachedToDistribution:false,
                        distributionName:null,
                        nftokenID:null,
                        txHash:null,
                        preliminaryResult:null,
                        finalResult:null,
                        ledgerIndex:null,
                    }
                    items.push(itemToMint)
                }
            }
            if(items.length===0) return {result:'warn',message:'No elligible items found in this deployment.'}
            else{
                infoMessage(`Found ${items.length} elligible items in this deployment to mint.`)
                let correctNumberOfItems = await askYesNo(`Is this correct?`,true)
                if(!correctNumberOfItems) return {result:'warn',message:'User cancelled mint creation.'}
                else
                {
                    printBanner()
                    infoMessage(`NFTs on the XRPL have several built in settings that you can configure.`)
                    console.log()
                    warningMessage(`NFTs by default are not able to be transfered from one owner to another.`)
                    
                    transferable = await askYesNo(`Do you want your NFTs to be transferable?`,true)
                    console.log()
                    if(transferable)
                    {
                        warningMessage(`NFTs on the XRPL have built in royalty mechanics known as the 'Transfer Fee'.`)
                        infoMessage(`You can set up to 50% royalties on all secondary sales.`)
                        transferFee = await askForNumberMinMax(`Enter the transfer fee (0-50):`,0,50)
                        
                        transferFee = Number(transferFee)*1000
                        console.log()
                        warningMessage(`You can restrict trading of NFTs minted to only be traded in $XRP.`)
                        infoMessage(`If you do not enable this, you will still have to set a trustline in the minting account for NFTs to be traded in any other currency.`)
                        onlyXRP = await askYesNo(`Do you want to restrict trading to only $XRP?`,false)
                    }
                    console.log()
                    warningMessage(`NFTs on the XRPL have an option to be burnable by the minter.`)
                    burnable = await askYesNo(`Would you (as the minter) like to be able to burn NFTs on behalf of holders? (not reccomended)`,false)
                    
                    console.log()
                    warningMessage(`Token taxons can be used to identify specific collections of NFTs.`)
                    tokenTaxon = await askForNumberMinMax(`Please identify a token taxon for this NFT collection.(0-2147483648):`,0,2147483648)
                    
                    tokenTaxon = Number(tokenTaxon)
                    console.log();

                    let mintConfig = {
                        name:name,
                        projectName:currentConfig.NFT.name,
                        status:'created',
                        timeCreated:new Date().toISOString(),
                        transferable,
                        transferFee,
                        onlyXRP,
                        burnable,
                        tokenTaxon,
                        ledgerIndexStart:null,
                        ledgerIndexEnd:null,
                        successfullMints:0,
                        failedMints:0,
                        selectedDeployment:currentConfig.NFT_METADATA.name,
                    }
                    infoMessage(`Please confirm the following mint configuration:`)
                    console.log(mintConfig)
                    let confirmMint = await askYesNo(`Is this correct?`,true)
                    if(confirmMint)
                    {
                        mintConfig.items=items
                        currentConfig.NFT_MINT = mintConfig
                        await configHandler.updateCurrentConfig(currentConfig)
                        return {result:'success',message:'New mint created.',config:mintConfig}
                    }
                    else
                    {
                        warningMessage(`Mint creation cancelled.`)
                        if(await askYesNo(`Would you like to try again?`,true)) return await createNFTMintConfig(name)
                        else return {result:'warn',message:'Mint creation cancelled.'}
                    }
                }
            }

        }
    }
    catch(err)
    {
    console.log('There was a problem creating the mint config: ',err)
    await pressAnyKey()
    }
}