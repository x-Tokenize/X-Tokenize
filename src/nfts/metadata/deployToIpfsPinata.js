import pinataSDK from '@pinata/sdk'
import { pressAnyKey } from '../../utils/index.js'

 /**
 * @function deployToIpfsPinata
 * @description
 * Deploys a file to IPFS using the Pinata service. The function takes a readStream of the file, the file
 * name, and the API keys for Pinata. It initializes the Pinata SDK with the provided API keys, sets the metadata for
 * the file, and pins the file to IPFS. If the deployment is successful, it returns an object containing the result, a
 * success message, and the IPFS URI. If the deployment fails, it returns an object containing the result, a failure
 * message, and a null URI.
 * 
 * @param {ReadableStream} readStream - The readStream of the file to be deployed.
 * @param {string} fileName - The name of the file to be deployed.
 * @param {Object} apiKeys - An object containing the Pinata API key and secret.
 * @param {string} apiKeys.key - The Pinata API key.
 * @param {string} apiKeys.secret - The Pinata secret API key.
 * @returns {Promise<NFTMetadataDeploymentResult>} - An object containing the deployment result, a message, and the IPFS URI.
 * @throws {Error} - If there is an error during the deployment process.
 */
export const deployToIpfsPinata = async(readStream,fileName,apiKeys)=>{
        try
        {
            let pinata = new pinataSDK({pinataApiKey:apiKeys.key,pinataSecretApiKey:apiKeys.secret})
            let options = {pinataMetadata: {name: fileName}}
            if(apiKeys.key ==="test") return{result:'success',message:'API KEY WAS SET TO TEST.',uri:'ipfs://Qmabcdefg1234567890'}
            let pinResult = await pinata.pinFileToIPFS(readStream,options)
            if(pinResult.IpfsHash)
            {
                let URI=`ipfs://${pinResult.IpfsHash}`
                return {result:'success',message:`The file was successfully deployed to IPFS Pinata.`,uri:URI}
            }
            else 
            {
                console.log('There was a problem deploying to IPFS Pinata: ',pinResult)
                await pressAnyKey()
                return {result:'failed',message:`Failed to deploy the file to IPFS Pinata.`,uri:null}
            }
        }
        catch(err)
        {
            console.log('There was a problem deploying to IPFS Pinata: ',err)
        }
}