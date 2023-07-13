
/**
 * @function getFee
 * @description
 * Retrieves the current fee required for transactions on the XRPL by submitting a fee request to the
 * specified networkRPC. If the fee is successfully retrieved, it returns the fee in drops. If there is an issue with
 * the request or the response does not contain the fee information, it returns false and logs the error.
 * 
 * @param {string} networkRPC - The URL of the XRPL node to submit the fee request to.
 * @returns {Promise<Object|boolean>} - Returns an object containing the fee in drops if successful, or false if there was
 * an issue with the request or response.
 * @throws {Error} - Throws an error if there is a problem with the fee request.
 */
export const getFee = async(networkRPC) =>{
        try{
            let feeResponse = await submitRequest({"method":"fee","params":[]},networkRPC)
            if(feeResponse?.result?.drops) return feeResponse.result.drops
            else return false
        }catch(err)
        {
            console.log('There was a problem getting the fee: ',err)
        }
}
