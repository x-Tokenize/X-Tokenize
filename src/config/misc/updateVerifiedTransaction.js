import {configHandler} from '../configHandler.js'


/**
 * @function updateVerifiedTransaction
 * @description
 * This function updates the verified transaction log for a given address and transaction hash. It first
 * retrieves the transaction logs from the configuration, then searches for the specific transaction log for the given
 * address. If found, it updates the transaction's finalTxResult and sets its verified status to true. Finally, it saves
 * the updated transaction log back to the configuration.
 * 
 * @param {string} address - The address of the account associated with the transaction.
 * @param {string} hash - The hash of the transaction to be updated.
 * @param {Object} finalTxResult - The final transaction result object to be set for the transaction.
 * @returns {OperationResult} - An object containing the result and a message describing the result.
 * @throws {Error} - If there is a problem updating the verified transaction, an error is logged to the console.
 */
export const updateVerifiedTransaction = async(address,hash,finalTxResult)=>{
    try
    {
        let transactions = await configHandler.getConfigs(`TRANSACTIONS`)
        let accountTxs = transactions[address]
        if(!accountTxs) return {result:'failed',message:'Could not find transaction log for account to update.'}
        else
        {
            let tx = accountTxs.find(tx=>tx.hash===hash)
            if(!tx) return {result:'failed',message:'Could not find transaction in transaction log to update.'}
            else
            {
                tx.finalTxResult = finalTxResult
                tx.verified = true;
                await configHandler.setConfig(`TRANSACTIONS`,address,accountTxs)
                return {result:'success',message:'Transaction log updated.'}
            }
        }
    }
    catch(err)
    {
        console.log('There was a problem updating the verified transaction: ',err)
    }
}