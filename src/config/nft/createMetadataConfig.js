import { configHandler } from "../configHandler.js"
import { makeDirectory,infoMessage,askYesNo,warningMessage,getJsonFileContentsFromFullPath,getDirectoryContents,askWhichFromList,askForTextInput,handleSeedEncryptionDecryption,getJsonFileContents,askQuestion } from "../../utils/index.js"
import { checkNFTAssetDirectory,getPropertyFileType } from "../../nfts/index.js"

/**
 * @function createMetadataConfig
 * @description
 * This function creates a new NFT Metadata deployment configuration for metadata that has already been deployed or 
 * needs to be deployed to IPFS or AWS. A directory is created with the name of the configuration which is used to store
 * the metadata and assets or the list of uris if the metadata is already deployed.
 * 
 * @param {string} name - The name of the NFT metadata configuration.
 * @returns {ConfigCreationResult} - An object containing the result, message and (if successful) the created metadata config.
 * @throws {Error} - If there is a problem creating the config.
 */
export const createMetadataConfig = async(name)=>{
    try
    {  
        let projectName = configHandler.getCurrentProjectName()   
        makeDirectory(`${process.cwd()}/nft-metadata/`)
        makeDirectory(`${process.cwd()}/nft-metadata/${projectName}`)
        makeDirectory(`${process.cwd()}/nft-metadata/${projectName}/${name}`)
        makeDirectory(`${process.cwd()}/nft-metadata/${projectName}/${name}/metadata`)
        makeDirectory(`${process.cwd()}/nft-metadata/${projectName}/${name}/assets`)
        infoMessage(`Let's set up your metadata configuration!`)
        infoMessage(`X-Tokenize can deploy your metadata to IPFS or AWS for you.`)
        infoMessage(`Alternatively, if you have already deployed you can provide a list of URIS to your metadata.`)
        if(await askYesNo(`Is your metadata already deployed?`, false))
        {
            warningMessage(`To create a metadata deployment using already deployed metadata, you must provide a JSON file containing the URIs.`)
            infoMessage(`The JSON file should be in the following directory:\n${process.cwd()}/nft-metadata/${projectName}/${name}/metadata/`)
            infoMessage(`The JSON file should be named: metadata.json`)
            infoMessage(`The JSON file should be formatted as follows:`)
console.log(`
{
"metadata":[
{"file":"SomeMetadataFile","uri":"ipfs://SomeIpfsHash"},
{"file":"1.json","uri":"s3://SomeAWSBucket/SomeBucketDirectory/SomeFile"},
{"file":"coolNFT.json","uri":"s3://SomeAWSBucket/SomeBucketDirectory/SomeOtherFile"},
{"file":"SomeMetadataFileName","uri":"https://SomeURL.com/SomeFile"}
]
}
`)
            console.log()
            if(!await askYesNo('Are you ready to create a metadata deployment?',true)) return {result:'warn',message:'User cancelled metadata deployment creation.'}
            else
            {
                    let metadataJSONContents = getJsonFileContentsFromFullPath(`${process.cwd()}/nft-metadata/${projectName}/${name}/metadata/metadata.json`)
                    if(!metadataJSONContents ) return {result:'warn',message:'No URIs found in the metadata.json file!'}
                    else if (metadataJSONContents.metadata)
                    {
                        let metadataURIs = metadataJSONContents.metadata
                        if(metadataURIs && metadataURIs.length>0)
                        {
                            let invalidEntries = []
                            for(let i=0;i<metadataURIs.length;i++)
                            {
                                if(!metadataURIs[i].file || !metadataURIs[i].uri) invalidEntries.push(metadataURIs[i])
                            }
                            if(invalidEntries.length>0)
                            {
                                warningMessage(`The following entries in the metadata.json file are invalid:`)
                                console.log(invalidEntries)
                                console.log()
                                return {result:'warn',message:'Invalid entries in metadata.json file'}
                            }
                            else
                            {
                                let deploymentItems = []
                                for(let i=0;i<metadataURIs.length;i++)
                                {
                                    let deploymentItem =   {
                                        file:metadataURIs[i].file,
                                        fileName:'N/A',
                                        status:'deployed',
                                        attachedToMint:false,
                                        mintName:'',
                                        deployed:true,
                                        uri:metadataURIs[i].uri,
                                        additionalDeployments:{},
                                    }
                                    deploymentItems.push(deploymentItem)
                                }

                                let config = {
                                    name:name,
                                    projectName:projectName,
                                    deploymentType:null,
                                    apiKeys:null,
                                    directory:`nft-metadata/${projectName}/${name}`,
                                    status:'deployed',
                                    additionalDeployments:{},
                                    numDeploymentItems:deploymentItems.length,
                                }
                                infoMessage(`Please confirm the following metadata configuration:`)
                                console.log(config)
                                let confirmDeployment = await askYesNo(`Is this correct?`,true)
                                if(confirmDeployment)
                                {
                                    config.items=deploymentItems
                                    return {result:'success',message:'New metadata deployment created.',config:config}
                                } 
                                else
                                {
                                    warningMessage(`Metadata configuration incorrect.`)
                                    if(await askYesNo(`Would you like to try again?`,true)) return await createMetadataConfig(name)
                                    else return {result:'warn',message:'Metadata config creation cancelled.'}
                                }
                            }
                        }
                        else return {result:'warn',message:'No URIs found in the metadata.json file!'}
                    }
            }
        }
        else
        {
            warningMessage(`To create a metadata configuration, all metadata files and assets must be in the appropriate location.`)
            infoMessage(`In the following directory: \n${process.cwd()}/nft-metadata/${projectName}/${name}/`)
            warningMessage(`In this directory, you should have a metadata folder and an assets folder.`)
            infoMessage(`Place your metadata files in the metadata folder.`)
            infoMessage(`Place your asset files (images,videos,stls) in the assets folder.`)

            let readyToCreate = await askYesNo('Are you ready to create a metadata deployment?') 
            if(!readyToCreate) return {result:'warn',message:'User cancelled metadata deployment creation.'}
            else
            {
                let metadataDirectoryContents = getDirectoryContents(`${process.cwd()}/nft-metadata/${projectName}/${name}/metadata`)
                if(metadataDirectoryContents.length==0) return {result:'warn',message:'No metadata files found in the metadata directory!'}
                else
                {
                    infoMessage(`Found ${metadataDirectoryContents.length} metadata files in the metadata directory.`)
                    let correctNumberOfMetadataFiles = await askYesNo(`Is this correct?`,true)
                    if(!correctNumberOfMetadataFiles) return {result:'warn',message:'User cancelled metadata deployment creation.'}
                    else
                    {
                        //TODO: ADD "MULTIPLE" Options to attach mirrors to the metadata files
                        let deploymentType = await askWhichFromList(`Select the metadata deployment method:`,['IPFS (Pinata)','AWS S3','Cancel'])
                        if(deploymentType === 'Cancel') return {result:'warn',message:'User cancelled metadata deployment creation.'}
                        else
                        {
                            let apiKeys = {
                                key:'',
                                secret:'',
                                region:'',
                                bucket:'',
                                secretEncrypted:false
                            }
                            
                            let key = await askForTextInput(`Enter your ${deploymentType} API key:`)
                            let secret = await askForTextInput(`Enter your ${deploymentType} API secret:`)
                            let {seed,seedEncrypted} = await handleSeedEncryptionDecryption(secret,false);
                            apiKeys.key=key;
                            apiKeys.secret = seed;
                            apiKeys.secretEncrypted = seedEncrypted;

                            if(deploymentType==='AWS S3')
                            {
                                let region = await askForTextInput(`Enter your AWS region:`)
                                let bucket = await askForTextInput(`Enter your AWS bucket name:`)
                                apiKeys.region = region
                                apiKeys.bucket = bucket
                            }
                            
                        
                            let itemAdditionalDeployments= {}
                            let metadataJSON,metadataKeys,additionalFileDeployments,additionalDeployments
                            let additionalDeploymentsNeeded = await askYesNo(`Do you need to deploy any additional files like images and videos before deploying the metadata?`,true)
                            if(additionalDeploymentsNeeded)
                            {
                                metadataJSON = getJsonFileContents(`${process.cwd()}/nft-metadata/${projectName}/${name}/metadata`,metadataDirectoryContents[0]);
                                metadataKeys = Object.keys(metadataJSON)
                                
                                additionalFileDeployments = await askQuestion({type:'checkbox',message:'Which properties need additional file deployments?',choices:metadataKeys})
                                additionalDeployments = [];
                                for(let i=0;i<additionalFileDeployments.length;i++)
                                {
                                    let fileType = await getPropertyFileType(additionalFileDeployments[i]);
                                    additionalDeployments.push({property:additionalFileDeployments[i],fileType})
                                }
                                let missingAssets = await checkNFTAssetDirectory(`nft-metadata/${projectName}/${name}/assets`,metadataDirectoryContents,additionalDeployments)
                                if(missingAssets.length>0)
                                {
                                    warningMessage(`The following assets are missing from the assets directory:`)
                                    for(let i=0;i<missingAssets.length;i++)
                                    {
                                        warningMessage(missingAssets[i])
                                    }
                                    return {result:'warn',message:'Missing assets!'}
                                }
                                else 
                                {
                                    infoMessage(`All assets are present!`)
                                    additionalDeployments.forEach((additional)=>{
                                        itemAdditionalDeployments[additional.property] = {
                                            status:'pending',
                                            uri:'',
                                        }
                                    })
                                }
                            }
                            else additionalDeployments=[]
                            
                            let deploymentItems = []
                            for(let i=0;i<metadataDirectoryContents.length;i++)
                            {
                                let deploymentItem =   {
                                    file:metadataDirectoryContents[i],
                                    fileName:metadataDirectoryContents[i].split('.')[0],
                                    status:'pending',
                                    attachedToMint:false,
                                    mintName:'',
                                    deployed:false,
                                    uri:'',
                                    additionalDeployments:{...itemAdditionalDeployments},
                                }
                                deploymentItems.push(deploymentItem)
                            }

                            let config = {
                                name:name,
                                projectName:projectName,
                                deploymentType:deploymentType,
                                apiKeys:apiKeys,
                                directory:`${process.cwd()}/nft-metadata/${projectName}/${name}`,
                                status:'pending',
                                additionalDeployments:additionalDeployments,
                                numDeploymentItems:deploymentItems.length,

                            }
                            infoMessage(`Please confirm the following metadata configuration:`)
                            console.log(config)
                            let confirmDeployment = await askYesNo(`Is this correct?`,true)
                            if(confirmDeployment)
                            {
                                config.items=deploymentItems
                                return {result:'success',message:'New metadata deployment created.',config:config}
                            } 
                            else
                            {
                                warningMessage(`Metadata configuration incorrect.`)
                                if(await askYesNo(`Would you like to try again?`,true)) return await createMetadataConfig(name)
                                else return {result:'warn',message:'Metadata config creation cancelled.'}
                            }
                        }
                    }
                }
            }
    }
}catch(err)
{
console.log('There was a problem creating the metadata config: ',err)
}

}