import { configHandler } from "../../config/configHandler.js"
import { handleAssetDeployment } from "./handleAssetDeployment.js"
import { checkAndAttachAssetsToMetadata } from "./checkAndAttachAssetsToMetadata.js"
import { deploy } from "./deploy.js"
import { pressAnyKey } from "../../utils/index.js"

 /**
 * @function handleItem
 * @description
 * Handles the deployment process of an NFT item by updating its status and performing necessary actions
 * based on the current status. The function goes through various stages such as handling assets, attaching assets to
 * metadata, deploying metadata, and updating the item's status accordingly. It starts by checking the item's current
 * status and performs the appropriate action for each status. For example, if the status is 'pending', it updates the
 * status to 'handling-assets' and proceeds to the next stage. If the status is 'handling-assets', it calls the
 * handleAssetDeployment function to deploy the assets and updates the status accordingly. Similarly, for
 * 'assets-handled' and 'assets-deployed' statuses, it calls checkAndAttachAssetsToMetadata and deploy functions
 * respectively to attach assets to metadata and deploy metadata. Finally, when the status is 'metadata-deployed', it
 * updates the item's status to 'deployed' and marks it as successfully deployed.
 * 
 * @param {Object} currentConfig - The current configuration object containing NFT project settings.
 * @param {Object} apiKeys - The API keys object containing necessary keys for interacting with external services.
 * @param {Object} item - The NFT item object containing information about the item to be deployed.
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the handled item.
 * @throws {Error} - Throws an error if there is a problem handling the deployment.
 */

export const handleItem = async(currentConfig,apiKeys,item)=>{
        try{
            switch(item.status)
            {
                case 'pending':
                    {
                        item.status = 'handling-assets'
                        await configHandler.updateCurrentConfig(currentConfig)
                        return {result:'success',message:'Item is ready to be handled'}
                    }
                case 'handling-assets':
                    {
                        let assetsHandledResult = await handleAssetDeployment(currentConfig,apiKeys,item)
                        if(assetsHandledResult.result !=='success') return {result:'warn',message:'Failed to deploy an asset'}
                        else return {result:'success',message:'Assets were deployed.'}
                    }
                case 'assets-handled':
                    {
                        let assetsURIsAttached = await checkAndAttachAssetsToMetadata(currentConfig,item)
                        if(assetsURIsAttached.result !=='success') return {result:'warn',message:'Failed to attach an asset URI to metadata'}
                        else return {result:'success',message:'Assets were attached to metadata.'}
                    }
                case 'assets-deployed':
                    {
                        let path = `${currentConfig.NFT_METADATA.directory}/metadata/${item.file}`
                        // if(currentConfig.NFT.network==='testnet') metadataDeployed ={result:'success',uri:'ipfs://abcdefghijklmnopqrs'}
                        // else 
                        let metadataDeployed = await deploy(currentConfig,path,item.file,apiKeys)
                        if(metadataDeployed.result==='success')
                        {
                            item.uri = metadataDeployed.uri
                            item.status = 'metadata-deployed'
                            await configHandler.updateCurrentConfig(currentConfig)
                            return {result:'success',message:'Metadata was deployed.'}
                        }
                        else
                        {
                            item.status = 'failed'
                            item.reason = `Failed to deploy metadata.`
                            await configHandler.updateCurrentConfig(currentConfig)
                            return {result:'failed',message:'Failed to deploy metadata.'}
                        }
                    }
                case 'metadata-deployed':
                    {
                        if(item.uri !== "")
                        {
                            item.status = 'deployed'
                            item.deployed = true
                            await configHandler.updateCurrentConfig(currentConfig)
                            return {result:'success',message:'Item is deployed.'}
                        }
                        else
                        {
                            item.status = 'failed'
                            item.reason = `Failed to deploy metadata.`
                            await configHandler.updateCurrentConfig(currentConfig)
                            return {result:'failed',message:'Failed to deploy metadata.'}
                        }
                    }
                case 'deployed':
                    {
                        return {result:'success',message:'Item is deployed.'}
                    }
               
            }
            
        }
        catch(err)
        {
            console.log('There was a problem handling the deployment',err)
        }
}