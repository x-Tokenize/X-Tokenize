import { configHandler } from "../../config/configHandler.js";
import { deployToAws } from "./deployToAws.js";
import { deployToIpfsPinata } from "./deployToIpfsPinata.js";
import fs from 'fs'
import { pressAnyKey } from "../../utils/index.js";

/**
 * @function deploy
 * @description
 * This function deploys the NFT metadata to the specified deployment type (IPFS Pinata or AWS S3) based
 * on the current configuration. It reads the file from the given file path and creates a read stream to be used by the
 * deployment functions. It then calls the appropriate deployment function based on the deployment type and returns the result.
 * 
 * @param {Object} currentConfig - The current configuration object containing the NFT_METADATA and other settings.
 * @param {string} filePath - The file path of the NFT metadata to be deployed.
 * @param {string} fileName - The file name of the NFT metadata to be deployed.
 * @param {Object} apiKeys - The API keys required for the deployment (e.g., Pinata API keys for IPFS
 * deployment or AWS credentials for S3 deployment).
 * @returns {Promise<NFTMetadataDeploymentResult>} - An object containg the result, message and URI of the deployed item.
 * @throws {Error} - If there is a problem during the deployment process, an error is thrown with a description
 * of the issue.
 */
export const deploy = async(currentConfig,filePath,fileName,apiKeys)=>{
        try{
            let {deploymentType} = currentConfig.NFT_METADATA
            let readStream = fs.createReadStream(filePath);
            switch(deploymentType)
            {
                case 'IPFS (Pinata)':
                    {
                        return await deployToIpfsPinata(readStream,fileName,apiKeys)
                    }
                case 'AWS S3':
                    {
                        return await deployToAws(readStream,fileName,apiKeys,currentConfig.NFT.name)
                    }
            }
        }
        catch(err)
        {
            console.log('There was a problem deploying asset: ',err)
        }
}