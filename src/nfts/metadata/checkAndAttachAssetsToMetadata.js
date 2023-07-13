import {configHandler} from '../../config/configHandler.js'
import { verifyFile,getJsonFileContentsFromFullPath, saveJsonToFileFromFullPath } from '../../utils/index.js'

/**
 * @function checkAndAttachAssetsToMetadata
 * @description
 * This function checks and attaches assets to the metadata of an NFT item. It first verifies if there are
 * any additional deployments required for the item. If all additional deployments are handled, it then checks if the
 * metadata file exists and updates the metadata with the additional deployment URIs. Finally, it updates the item
 * status and saves the updated metadata to the file.
 * 
 * @param {Object} currentConfig - The current configuration object containing NFT_METADATA properties.
 * @param {Object} item - The NFT item object containing additionalDeployments, status, and other properties.
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the operation.
 * @throws {Error} - Throws an error if there is a problem checking and attaching assets to metadata.
 */
export const checkAndAttachAssetsToMetadata = async(currentConfig,item)=>{
        try
        {
            let {directory,additionalDeployments} = currentConfig.NFT_METADATA
            if(additionalDeployments.length>0)
            {
                let allHandled = true
                for(let i = 0 ;i<additionalDeployments.length;i++)
                {
                    let itemStatus = item.additionalDeployments[additionalDeployments[i].property].status
                    // console.log(itemStatus)
                    if(itemStatus !== 'deployed' && itemStatus!=='attached'){
                        allHandled = false
                        break;
                    }
                    if(item.additionalDeployments[additionalDeployments[i].property].uri === "")
                        {
                            allHandled = false
                            break;
                        }
                }
                if(allHandled)
                {
                    let filepath = `${directory}/metadata/${item.file}`
                    let fileExists = verifyFile(directory+'/metadata/',item.file)
                    if(fileExists)
                    {
                        let itemJSON = await getJsonFileContentsFromFullPath(filepath)
                        for(let i = 0 ;i<additionalDeployments.length;i++)
                        {
                            itemJSON[additionalDeployments[i].property] = item.additionalDeployments[additionalDeployments[i].property].uri
                            item.additionalDeployments[additionalDeployments[i].property].status = 'attached'
                        }
                        let saved = saveJsonToFileFromFullPath(filepath,itemJSON,false)
                        if(saved)
                        {
                            item.metadata = itemJSON
                            await configHandler.updateCurrentConfig(currentConfig)
                        }
                        else
                        {
                            item.status = 'failed'
                            item.reason= `${item.file} failed to save.`
                            allHandled=false;
                            await configHandler.updateCurrentConfig(currentConfig)

                        } 
                    }
                    else
                    {
                        item.status = 'failed'
                        item.reason= `${item.file} does not exist.`
                        item.additionalDeployments[additionalDeployments[i].property].status = 'failed'
                        item.additionalDeployments[additionalDeployments[i].property].reason = 'File does not exist.'
                        allHandled=false;  
                    }
                   if(allHandled)
                   {
                        item.status = 'assets-deployed'
                        await configHandler.updateCurrentConfig(currentConfig)
                        return {result:'success',message:'All assets for this item were successfully attached to metadata.'}
                   }
                   else
                   {
                        item.status = 'failed'
                        item.reason= `There was a problem attaching assets to metadata for this item.`
                        await configHandler.updateCurrentConfig(currentConfig)
                        return {result:'failed',message:'There was a problem attaching assets to metadata for this item.'}
                   }
                }
            }
            else
            {
                item.status = 'assets-deployed'
                await configHandler.updateCurrentConfig(currentConfig)
                return {result:'success',message:'No additional deployments required for this item.'}
            }

        }
        catch(err)
        {
            console.log(`There was a problem checking and attaching assets to metadata: ${err}`)
        }

}