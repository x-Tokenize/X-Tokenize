

/**
 * @function checkMetadataDeployed
 * @description
 * This function checks if the metadata of a given item has been deployed by verifying if the item's URI
 * is not empty. It returns true if the metadata is deployed, and false otherwise.
 * 
 * @param {Object} item - The item object containing the metadata information.
 * @param {string} item.uri - The URI of the item's metadata.
 * @returns {Promise<boolean>} - Returns true if the item's metadata is deployed, false otherwise.
 * @throws Will log an error message if there is a problem checking metadata deployment.
 */
export const checkMetadataDeployed = async(item)=>{
        try{
            if(item.uri !=="" )
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
            console.log('There was a problem checking metadata deployment: ',err)
        }
}