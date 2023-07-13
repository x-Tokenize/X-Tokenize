import { configHandler } from "../config/configHandler.js"
import { askForNumberMinMax, makeDirectory } from "../utils/index.js"
import fs from 'fs'

 /**
 * @function createMockMetadataAndAssets
 * @description
 * This function creates mock metadata and assets for an NFT project. It generates a random name for the
 * metadata deployment, creates a metadata object with the necessary properties, and then creates a specified number of
 * mock assets. The assets are saved in the appropriate directories and the current configuration is updated with the
 * new mock metadata.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the operation.
 * @throws {Error} - If there is a problem creating mock metadata and assets, an error is logged to the console.
 */

export const createMockMetadataAndAssets = async()=>{
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
                status: "pending",
                additionalDeployments: [
                    {
                        property: "image",
                        fileType: ".png"
                    },
                    {
                        property:"video",
                        fileType: ".mp4"
                    },
                    {
                        property:"audio",
                        fileType: ".mp3"
                    }
                ],
                items:[]
            }
               
            let metadataItem = 
                {
                    file: "",
                    fileName: "",
                    status: "pending",
                    attachedToMint: false,
                    mintName: "",
                    deployed: false,
                    uri: "",
                    additionalDeployments: 
                    {
                        image: {
                            status: "pending",
                            uri: ""
                        },
                        video: {
                            status: "pending",
                            uri: ""
                        },
                        audio: {
                            status: "pending",
                            uri: ""
                        }
                    }
                }
            
            let numberOfMockAssets = await askForNumberMinMax(`How many mock metadata files and assets would you like to create?`,1,10000)
            makeDirectory(`nft-metadata/${currentConfig.NFT.name}/MockMetadataDeployment#${random}`)
            makeDirectory(`nft-metadata/${currentConfig.NFT.name}/MockMetadataDeployment#${random}/metadata`)
            makeDirectory(`nft-metadata/${currentConfig.NFT.name}/MockMetadataDeployment#${random}/assets`)
            
            for(let i = 0; i < numberOfMockAssets; i++)
            {
                let random  = Math.floor(100000000*Math.random()).toString()
                let mockMetadataItem = JSON.parse(JSON.stringify(metadataItem))
                mockMetadataItem.file = `${random}.json`
                mockMetadataItem.fileName = `${random}`
                mockMetadata.items.push(mockMetadataItem)

                let json = {
                    schema:"ipfs://QmNpi8rcXEkohca8iXu7zysKKSJYqCvBJn3xJwga8jXqWU",
                    nftType:"art.v0",
                    name:random.toString(),
                    description: `This is a mock description for ${random}`,
                    image:"",
                    video:"",
                    audio:""
                }
                fs.writeFileSync(`nft-metadata/${currentConfig.NFT.name}/${name}/metadata/${random}.json`,JSON.stringify(json))
                fs.writeFileSync(`nft-metadata/${currentConfig.NFT.name}/${name}/assets/${random}.png`,'')
                fs.writeFileSync(`nft-metadata/${currentConfig.NFT.name}/${name}/assets/${random}.mp4`,'')
                fs.writeFileSync(`nft-metadata/${currentConfig.NFT.name}/${name}/assets/${random}.mp3`,'')
            }
            currentConfig.NFT_METADATA = mockMetadata
            await configHandler.updateCurrentConfig(currentConfig)
            return {result:'success',message:`Mock metadata and assets created at nft-metadata/${currentConfig.NFT.name}/${name}`}

        }
        catch(err)
        {
            console.log('THere was a problem creating mock metadata and assets',err)
        }
}