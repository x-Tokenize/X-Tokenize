import { S3Client,PutObjectCommand } from "@aws-sdk/client-s3";
import { pressAnyKey } from "../../utils/index.js";

/**
 * @function deployToAws
 * @description
 * Deploys a file to Amazon Web Services (AWS) S3 storage using the provided readStream, fileName,
 * apiKeys, and configName. The function creates an S3Client with the provided API keys and region, then sends a
 * PutObjectCommand with the specified parameters to upload the file to the S3 bucket. If the upload is successful, the
 * function returns an object containing the result, a success message, and the URI of the uploaded file. If an error
 * occurs during the upload, the function logs the error, waits for the user to press any key, and returns an object
 * containing the result and a failure message.
 * 
 * @param {ReadableStream} readStream - The read stream of the file to be uploaded.
 * @param {string} fileName - The name of the file to be uploaded.
 * @param {object} apiKeys - An object containing the AWS API keys, region, and bucket information.
 * @param {string} configName - The configuration name to be used as a prefix for the uploaded file's key.
 * @returns {Promise<NFTMetadataDeploymentResult>} - An Object containing the result, a message, and the URI of the uploaded file.
 * @throws {Error} - Throws an error if there is a problem deploying to AWS S3.
 */
export const deployToAws = async(readStream,fileName,apiKeys,configName)=>{
        try
        {
            let client = new S3Client({region:apiKeys.region,credentials:{accessKeyId:apiKeys.key,secretAccessKey:apiKeys.secret}})
            let params= {
            Bucket:apiKeys.bucket,
            Key:`${configName}/${fileName}`,
            Body:readStream,
            }
            let uploadResult = await client.send(new PutObjectCommand(params))
            const URI = `https://${apiKeys.bucket}.s3.${apiKeys.region}.amazonaws.com/${configName}/${fileName}`
            return {result:'success',message:`The file was successfully deployed to AWS S3.`,uri:URI}
        }
        catch(err)
        {
            console.log('There was a problem deploying to AWS S3: ',err)
            await pressAnyKey()
            return {result:'failed',message:`Failed to deploy the file to AWS S3.`,uri:null}
        }
}