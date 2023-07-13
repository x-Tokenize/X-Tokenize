import { configHandler } from "../../config/configHandler.js";
import { verifyFile } from "../../utils/index.js";
import { deploy } from "./deploy.js";

 /**
 * @function handleAssetDeployment
 * @description
 * Handles the deployment of assets for a given NFT item. It checks if there are any additional
 * deployments required, verifies the existence of asset files, and deploys them. It also updates the current
 * configuration with the deployment status and URI of the deployed assets.
 * 
 * @param {Object} currentConfig - The current configuration object containing NFT metadata and deployment settings.
 * @param {Object} apiKeys - The API keys used for deployment.
 * @param {Object} item - The NFT item object containing information about the item and its additional deployments.
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the asset deployment.
 * @throws {Error} - Throws an error if there is a problem handling asset deployment.
 */
export const handleAssetDeployment = async(currentConfig,apiKeys,item)=>{
        try
        {
            let {directory,additionalDeployments} = currentConfig.NFT_METADATA
            if(additionalDeployments.length>0 )
            {
                for(let i = 0 ;i<additionalDeployments.length;i++)
                {

                    if(item.additionalDeployments[additionalDeployments[i].property].status === 'pending'){
                        let assetFileName= item.fileName+additionalDeployments[i].fileType;
                        let assetpath = `${directory}/assets/${assetFileName}`
                        let fileExists = verifyFile(directory+'/assets/',assetFileName)
                        if(fileExists)
                        {
                            let deployed
                            deployed = await deploy(currentConfig,assetpath,assetFileName,apiKeys)

                            if(deployed.result==='success')
                            {
                                item.additionalDeployments[additionalDeployments[i].property].status = 'deployed'
                                item.additionalDeployments[additionalDeployments[i].property].uri = deployed.uri
                                await configHandler.updateCurrentConfig(currentConfig)
                            }
                           else
                           {
                                item.status = 'failed'
                                item.reason= `${assetFileName} failed to deploy.`
                                item.additionalDeployments[additionalDeployments[i].property].status = 'failed'
                                item.additionalDeployments[additionalDeployments[i].property].reason = 'Failed to deploy.'
                                allDeployed=false;
                                await configHandler.updateCurrentConfig(currentConfig)
                                break;
                           }
                        }
                        else{
                            item.status = 'failed'
                            item.reason= `${assetFileName} does not exist.`
                            item.additionalDeployments[additionalDeployments[i].property].status = 'failed'
                            item.additionalDeployments[additionalDeployments[i].property].reason = 'File does not exist.'
                            allDeployed=false;
                            await configHandler.updateCurrentConfig(currentConfig)
                            break;
                        }
              
                    }
                }
                let allDeployed
                for(let i = 0 ;i<additionalDeployments.length;i++)
                {
                    if(item.additionalDeployments[additionalDeployments[i].property].status === 'deployed') allDeployed=true;
                    else
                    {
                        allDeployed=false;
                        break;
                    }
                }
                if(allDeployed)
                {
                    item.status ='assets-handled'
                    await configHandler.updateCurrentConfig(currentConfig)
                    return {result:'success',message:'All assets for this item were successfully deployed.'}
                }
                else
                {
                    return {result:'failed',message:'There was a problem deploying assets for this item.'}
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
            console.log('There was a problem handling asset deployment: ',err)
        }
}