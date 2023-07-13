 /**
 * @function getTx
 * @description
 * Retrieves the transaction details for a given transaction hash on the XRPL. It sends a request to the
 * specified networkRPC with the transaction hash and returns the transaction details if found, otherwise returns false.
 * 
 * @param {string} networkRPC - The URL of the XRPL node to send the request to.
 * @param {string} txHash - The transaction hash to retrieve the details for.
 * @returns {Promise<Object|boolean>} - Returns the transaction details as an object if found, otherwise returns false.
 * @throws {Error} - Throws an error if there is a problem getting the transaction.
 */
export const getTx = async (networkRPC, txHash) => {
    try 
    {
        let tx = await submitRequest({ "method": "tx", "params": [{ "transaction": txHash }] }, networkRPC)
        if (tx?.result) return tx
        else return false
    }
    catch (err) {
        console.log('There was a problem getting the transaction: ', err)
    }
}