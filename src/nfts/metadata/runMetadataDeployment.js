import { configHandler } from "../../config/configHandler.js"
import { createSpinner,handleSeedEncryptionDecryption,pressAnyKey,wait, } from "../../utils/index.js";
import { handleItem } from "./handleItem.js";


/**
 * @function runMetadataDeployment
 * @description
 * This function is responsible for deploying metadata for NFTs. It first checks if the metadata has
 * already been deployed, and if not, it proceeds with the deployment process. It decrypts the API secret if it's
 * encrypted and iterates through the items in the metadata, handling each item individually. If there's an issue with
 * handling an item, it stops the deployment process and returns a warning message. If all items are successfully
 * deployed, it updates the current configuration and returns a success message.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the metadata deployment process.
 * @throws {Error} - If there's a problem deploying the metadata, an error is thrown with a description of the issue.
 */
export const runMetadataDeployment= async()=>{
        try
        {
            let currentConfig = await configHandler.getConfigs();
          
            if(currentConfig.NFT_METADATA.status ==='deployed') return {result:'warn',message:'Metadata has already been deployed'}
            else
            {
                let apiKeys = {...currentConfig.NFT_METADATA.apiKeys}
                if(apiKeys.secretEncrypted)
                {
                    let decrpyted = await handleSeedEncryptionDecryption(apiKeys.secret,true)
                    apiKeys.secret = decrpyted.seed
                }
                
                if(apiKeys.secretEncrypted && apiKeys.secret ===currentConfig.NFT_METADATA.apiKeys.secret) return {result:'warn',message:'API Secret was not decrypted.'}
                else
                {
                    let items = currentConfig.NFT_METADATA.items
                    let spinner = await createSpinner(`Deploying Metadata... 0/${items.length} | Item Status: pending`)
                    for(let i=0;i<items.length;i++)
                    {
                        do
                        {

                            let handleItemResult = await handleItem(currentConfig,apiKeys,items[i])
                            if(handleItemResult.result !=='success') 
                            {
                                spinner.stop()
                                console.log(`There was a problem handling item ${i}:`,handleItemResult.message)
                                await pressAnyKey()
                                return {result:'warn',message:`There was a problem handling item ${i}: ${handleItemResult.message}`}
                            }
                            
                             spinner.message(`Deploying Metadata... ${i}/${items.length} | Item Status: ${items[i].status}`)
                             await wait(1)
                        }while(items[i].status!=='deployed' && items[i].status!=='failed')  
                    }
                    spinner.stop()
                    let allItems = true;
                    if(allItems)
                    {
                        currentConfig.NFT_METADATA.status = 'deployed'
                        await configHandler.updateCurrentConfig(currentConfig)
                        return {result:'success',message:'Metadata has been deployed'}
                    }
                    else
                    {
                        return {result:'warn',message:'There was an error deploying metadata.'}
                    }
                }
          }
        }
        catch(err)
        {
            console.log('There was a problem deploying the metadata:',err)
        }
}

