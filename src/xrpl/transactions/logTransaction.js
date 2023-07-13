import {configHandler} from '../../config/configHandler.js'

/**
 * @function logTransaction
 * @description
 * This function logs a transaction by extracting the account information from the submission result,
 * cleaning up the submission result object, and then updating the transaction log for the account. It also sets the
 * verified property of the submission result to false.
 * 
 * @param {Object} submissionResult - The result object of a transaction submission.
 * @param {string} networkRPC - The network RPC URL used for the transaction.
 * @returns {Promise<Object>} - An object containing the result ('success' or 'failed') and a message
 * describing the outcome.
 * @throws Will log an error message if there is a problem creating the transaction log.
 */
export const logTransaction = async(submissionResult,networkRPC)=>{
    try
    {
        let account = submissionResult.tx_json.Account
        if(!account) return {result:'failed',message:'Could not get account from transaction to create transaction log.'}
        else
        {
            let cleanedSubmissionResult ={
                networkRPC:networkRPC,
                ...submissionResult.tx_json,
                validated_ledger_index:submissionResult.validated_ledger_index,
                preliminaryTxResult: submissionResult.engine_result,
                finalTxResult:null,
                verified:false,
            }
            submissionResult.verified = false;
            let transactions = await configHandler.getConfigs(`TRANSACTIONS`)
            let accountTxs = transactions[account]
            if(!accountTxs)  accountTxs = [cleanedSubmissionResult]
            else accountTxs.push(cleanedSubmissionResult)
            await configHandler.setConfig(`TRANSACTIONS`,account,accountTxs)
            return {result:'success',message:'Transaction log created.'}
        }
    }
    catch(err)
    {
        console.log('There was a problem creating the transaction log: ',err)
    }
}