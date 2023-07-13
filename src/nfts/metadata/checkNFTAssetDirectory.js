import { getDirectoryContents } from "../../utils/index.js";

/**
 * @function checkNFTAssetDirectory
 * @description
 * This function checks if all the required assets are present in the specified assets directory by
 * comparing the provided file names and asset properties file types. It returns an array of missing assets, if any.
 * 
 * @param {string} assetsdirectory - The directory path where the assets are located.
 * @param {Array<string>} fileNames - An array of file names to be checked in the assets directory.
 * @param {Array<{fileType: string}>} assetPropertiesFileTypes - An array of objects containing the file
 * types of the assets to be checked.
 * @returns {Promise<string[]>} - A promise that resolves to an array of missing assets file names.
 * @throws {Error} - Throws an error if there is an issue while checking the assets directory.
 */

export const checkNFTAssetDirectory = async (assetsdirectory,fileNames, assetPropertiesFileTypes) =>{
        try{
            let assetDirectory = getDirectoryContents(assetsdirectory)
            let missingAssets =[];
            for(let i=0;i<fileNames.length; i++)
            {
                let fileNameArray = fileNames[i].split('.');
                let fileName = fileNameArray[0];

                for(let y=0; y<assetPropertiesFileTypes.length;y++)
                {
                    let fileWithExtension = fileName.concat(assetPropertiesFileTypes[y].fileType)
                    if(assetDirectory.indexOf(fileWithExtension)===-1)
                    {
                        missingAssets.push(fileWithExtension);
                    }
                }
            }
            return missingAssets;
        }
        catch(err){
            console.log(err);
            reject(err)
        }
}