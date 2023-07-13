import { configHandler } from "../config/configHandler.js"
import { askForNumberMinMax } from "../utils/index.js"

/**
 * @function createMockMetadataDeployment
 * @description
 * This function creates a mock metadata deployment for an NFT project. It generates a random name for the
 * deployment, sets the deployment type to IPFS (Pinata), and creates a directory for the metadata. It then asks the
 * user for the number of mock metadata items to create and generates those items with random file names and URIs. The
 * mock metadata deployment is then added to the current configuration and the configuration is updated.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the operation.
 * @throws {Error} - If there is a problem creating the mock metadata deployment, an error is thrown and
 * logged to the console.
 */
export const createMockMetadataDeployment = async()=>{
        try{
            let currentConfig = await configHandler.getConfigs()
            let random = (Math.floor(Math.random()*10000)).toString()
            let name = `MockMetadataDeployment#${random}`
            let mockMetadata = {
                name: name,
                projectName: currentConfig.NFT.name,
                deploymentType: "IPFS (Pinata)",
                apiKeys:{"key":"test","secret":"test"},
                directory: `nft-metadata/${currentConfig.NFT.name}/${name}`,
                status: "deployed",
                additionalDeployments: [],
                items:[]
            }
            
            let amount = await askForNumberMinMax(`How many mock metadata items would you like to create?`,1,10000)
            for(let i = 0;i<amount;i++)
            {
                let random  = Math.floor(100000000*Math.random()).toString()
                let aMetadata = {
                    "file": random+".json",
                    "fileName": random,
                    "status": "deployed",
                    "attachedToMint":false,
                    "mintName":"",
                    "deployed": true,
                    "uri": "ipfs://QmPeitiHkxakhdqZsAFo4QdkkNUkCjSSzrXzCEw8sAnGAD",
                }
                mockMetadata.items.push(aMetadata)
            }
            currentConfig.NFT_METADATA = mockMetadata
            await configHandler.updateCurrentConfig(currentConfig)
            return {result:'success',message:`Mock metadata deployment created with name: ${name}`}

        }
        catch(err)
        {
            console.log('There was a problem creating mock metadata deployment')
        }
}