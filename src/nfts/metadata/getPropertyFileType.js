import { askForTextInput,askYesNo} from "../../utils/index.js"

 /**
 * @function getPropertyFileType
 * @description
 * This function prompts the user to input the file extension for a given property and confirms the input.
 * If the input is incorrect, the function will recursively call itself until the correct file extension is provided.
 * 
 * @param {string} property - The property for which the file extension is being requested.
 * @returns {Promise<string>} - The file extension for the given property.
 * @throws {Error} - If there is an error during the process, it will be logged and the error will be thrown.
 */
export const getPropertyFileType=  async(property)=>{
        try{
            let fileType = await askForTextInput(`What is the file extension for the ${property} property? (i.e. .png, .mp4, .pdf, etc..)`)
            if(await askYesNo(`You entered ${fileType}... Is this correct?`))return fileType
            else return await getPropertyFileType(property)
        }
        catch(err)
        {
            console.log(err);
            reject(err)
        }
}