import fs from 'fs'
import { errorMessage, infoMessage, successMessage } from '../output/message.js'

 /**
 * @function verifyFile
 * @description
 * Verifies if a file exists within a given directory by checking if the file name is present in the
 * directory's contents.
 * 
 * @param {string} path - The path of the directory to be checked.
 * @param {string} fileName - The name of the file to be verified.
 * @returns {boolean} - Returns true if the file exists in the directory, otherwise returns false.
 * @throws {Error} - Throws an error if there is an issue verifying the directory.
 */
export const verifyFile = (path,fileName)=>{
    try{
        let dir = fs.readdirSync(path)
        if(dir.indexOf(fileName)!=-1)return true
        else return false
    }
    catch(err)
    {
        console.log(err)
        errorMessage('There was an issue verifying the directory')
    }
}

/**
 * @function saveJsonToFile
 * @description
 * Saves a JSON object to a file in the specified directory. If the verbose flag is set, it will display a
 * success message upon completion.
 * 
 * @param {string} path - The path of the directory where the file will be saved.
 * @param {string} fileName - The name of the file to be saved.
 * @param {Object} json - The JSON object to be saved.
 * @param {boolean} verbose - Flag to display a success message if set to true.
 * @returns {boolean} - Returns true if the file is successfully saved, otherwise returns false.
 * @throws {Error} - Throws an error if there is an issue saving the file.
 */
export const saveJsonToFile = (path,fileName,json,verbose) =>{
    try{
        let stringedJson = JSON.stringify(json);
        fs.writeFileSync(path+`/${fileName}`,stringedJson)
        verbose?successMessage(`Success saving data!`):null
        return true
    }
    catch(err)
    {
        console.log(err)
        errorMessage('There was an issue saving your file!')
    }
}

/**
 * @function verifyDirectory
 * @description
 * Verifies if a directory exists by checking if its contents can be read.
 * 
 * @param {string} path - The path of the directory to be verified.
 * @returns {boolean} - Returns true if the directory exists, otherwise returns false.
 * @throws {Error} - Throws an error if there is an issue verifying the directory.
 */
export const verifyDirectory =(path)=>{
    try{
        let dir = fs.readdirSync(path)
        if(dir) return true
        else return false
    }
    catch(err)
    {
        if(err.code=='ENOENT')return false;
        else
        {
            errorMessage('There was an issue verifying the directory')
        }
        
    }
}

/**
 * @function makeDirectory
 * @description
 * Creates a new directory at the specified path if it does not already exist.
 * 
 * @param {string} path - The path where the new directory will be created.
 * @returns {boolean} - Returns true if the directory is successfully created or already exists, otherwise
 * returns false.
 * @throws {Error} - Throws an error if there is an issue creating the directory.
 */
export const makeDirectory =(path)=>{
    try{
        if(verifyDirectory(path)) return true
        else fs.mkdirSync(path)
       return makeDirectory(path)
    }
    catch(err)
    {
        console.log(err)
        errorMessage('There was an issue making the directory')
    }
}

/**
 * @function getDirectoryContents
 * @description
 * Retrieves the contents of a directory if it exists.
 * 
 * @param {string} path - The path of the directory to retrieve contents from.
 * @returns {Array<string>|boolean} - Returns an array of the directory contents if it exists, otherwise returns false.
 * @throws {Error} - Throws an error if there is an issue retrieving the directory contents.
 */
export const getDirectoryContents =(path)=>{
    try{
        if(verifyDirectory(path)) 
        {
           let dir = fs.readdirSync(path);
           return dir
        }
        else
        {
            errorMessage(`The directory path does not exist..`)
            return false;
        } 
    }
    catch(err)
    {
        console.log(err)
        errorMessage('There was an issue making the directory')
    }
}

/**
 * @function saveJsonToFileFromFullPath
 * @description
 * Saves a JSON object to a file at the specified full path. If the verbose flag is set, it will display a
 * success message upon completion.
 * 
 * @param {string} path - The full path of the file to be saved.
 * @param {Object} json - The JSON object to be saved.
 * @param {boolean} verbose - Flag to display a success message if set to true.
 * @returns {boolean} - Returns true if the file is successfully saved, otherwise returns false.
 * @throws {Error} - Throws an error if there is an issue saving the file.
 */
export const saveJsonToFileFromFullPath = (path,json,verbose) =>{
    try{
        let stringedJson = JSON.stringify(json);
        fs.writeFileSync(path,stringedJson)
        verbose?successMessage(`Success saving data!`):null
        return true
    }
    catch(err)
    {
        console.log(err)
        errorMessage('There was an issue saving your file!')
    }
}

/**
 * @function appendToJsonArrayFileFromFullPath
 * @description
 * Appends data to a JSON array file at the specified full path. If the verbose flag is set, it will
 * display a success message upon completion.
 * 
 * @param {string} path - The full path of the JSON array file.
 * @param {*} data - The data to be appended to the JSON array file.
 * @param {boolean} verbose - Flag to display a success message if set to true.
 * @returns {boolean} - Returns true if the data is successfully appended, otherwise returns false.
 * @throws {Error} - Throws an error if there is an issue appending data to the JSON array file.
 */
export const appendToJsonArrayFileFromFullPath = (path,data,verbose) =>{
    try
    {
        let file = fs.readFileSync(path).toString();
        let json =JSON.parse(file)
        json.push(data)
        let stringedJson = JSON.stringify(json)
        fs.writeFileSync(path,stringedJson)
        
        let newContents = getJsonFileContentsFromFullPath(path)
        
        if(newContents.length === json.length)
        {
            return true
        }
        else
        {
            return false
        }
    
    }
    catch(err)
    {
        console.log('There was a problem appending data to JSON array')
    }
}

/**
 * @function getJsonFileContentsFromFullPath
 * @description
 * Retrieves the contents of a JSON file at the specified full path.
 * 
 * @param {string} path - The full path of the JSON file.
 * @returns {Object|boolean} - Returns the JSON object if the file exists, otherwise returns false.
 * @throws {Error} - Throws an error if there is an issue retrieving the JSON file contents.
 */
export const getJsonFileContentsFromFullPath = (path)=>{
    try{
        let file = fs.readFileSync(path).toString()
        let json = JSON.parse(file)
        return json
    }
    catch(err)
    {
        if(err.code=='ENOENT')
        {
            errorMessage(`The file does not exist.`)
            infoMessage(`Please check ${path} and try again`)
            return false;
        }
        else
        {
            errorMessage('There was an issue getting JSON file contents')
            console.log(err)
            return false
        }
        
    }

}

/**
 * @function getJsonFileContents
 * @description
 * Retrieves the contents of a JSON file in the specified directory.
 * 
 * @param {string} path - The path of the directory containing the JSON file.
 * @param {string} fileName - The name of the JSON file.
 * @returns {Object|boolean} - Returns the JSON object if the file exists, otherwise returns false.
 * @throws {Error} - Throws an error if there is an issue retrieving the JSON file contents.
 */
export const getJsonFileContents =(path,fileName)=>{
    try{
        if(verifyFile(path,fileName)) 
        {
           let filePath = path+`/${fileName}`
           let file = fs.readFileSync(filePath).toString();
           let json =JSON.parse(file)
           return json
        }
        else
        {
            errorMessage(`The file does not exist..`)
            console.log(path,fileName)
            return false;
        } 
    }
    catch(err)
    {
        console.log(err)
        errorMessage('There was an issue making the directory')
    }
}

/**
 * @function appendToJsonArrayFile
 * @description
 * Appends data to a JSON array file in the specified directory.
 * 
 * @param {string} path - The path of the directory containing the JSON array file.
 * @param {string} fileName - The name of the JSON array file.
 * @param {*} data - The data to be appended to the JSON array file.
 * @returns {boolean} - Returns true if the data is successfully appended, otherwise returns false.
 * @throws {Error} - Throws an error if there is an issue appending data to the JSON array file.
 */
export const appendToJsonArrayFile = (path,fileName,data)=>{
    try
    {
        let filePath = path+`/${fileName}`
        let file = fs.readFileSync(filePath).toString();
        let json =JSON.parse(file)
        json.push(data)
        let stringedJson = JSON.stringify(json)
        fs.writeFileSync(filePath,stringedJson)
        
        let newContents = getJsonFileContents(path,fileName)
        
        if(newContents.length === json.length)
        {
            return true
        }
        else
        {
            return false
        }
    
    }
    catch(err)
    {
        console.log('There was a problem appending data to JSON array')
    }
}

/**
 * @function copyDirectory
 * @description
 * Recursively copies a directory and its contents to a new location.
 * 
 * @param {string} path - The path of the source directory.
 * @param {string} newPath - The path of the destination directory.
 * @returns {Promise<void>} - Returns a promise that resolves when the directory is successfully copied.
 * @throws {Error} - Throws an error if there is an issue copying the directory.
 */
export const copyDirectory=async (path,newPath) =>{
    try{
        fs.mkdirSync(newPath,{recursive:true})
        let entries =  fs.readdirSync(path,{withFileTypes:true});

    for (let i = 0; i <entries.length;i++) {
        let srcPath = path+'/'+entries[i].name
        let destPath = newPath+'/'+entries[i].name

        entries[i].isDirectory() ?
            copyDirectory(srcPath, destPath) :
            fs.copyFileSync(srcPath, destPath);
    }
    }
    catch(err)
    {
        console.log('There was a problem moving the directory!')
        console.log(err)
    }
}

/**
 * @function deleteDirectory
 * @description
 * Deletes a directory and its contents.
 * 
 * @param {string} path - The path of the directory to be deleted.
 * @returns {void} - No return value.
 * @throws {Error} - Throws an error if there is an issue deleting the directory.
 */

export const deleteDirectory = (path)=>{
    try{
        let dirContents = getDirectoryContents(path);
        console.log(dirContents)
        if(dirContents && dirContents.length>0)
        {
            for(let i = 0;i<dirContents.length;i++)
            {
                let pathToDelete = path+'/'+dirContents[i]
                console.log('path:',pathToDelete)
                fs.unlinkSync(pathToDelete)
            }
        }
        fs.rmdirSync(path)
        
        
    }
    catch(err)
    {
        console.log(err)
    }
}