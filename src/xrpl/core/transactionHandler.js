import { createSpinner, infoMessage, pressAnyKey, successMessage,errorMessage, wait ,askPassword,askPin,decrypt, askYesNo, warningMessage, printResponse,log} from "../../utils/index.js";
import { submitRequest } from "./requests.js";
import xrpl from 'xrpl'
import { configHandler } from "../../config/configHandler.js";
import { getWalletFromEncryptedSeed } from "../wallets/getWalletFromEncryptedSeed.js";
import { createAndSubscribeToPayload } from "../xumm/index.js";
import {signTxWithLedger} from '../wallets/ledger.js'
import { autofillTransaction } from "../data/index.js";
import { logTransaction } from "../transactions/logTransaction.js";
import { verifyTransactionResult } from "../data/verifyTransactionResult.js";


/**
 * @function handleTransactionSigning
 * @description
 * Handles the signing process of a transaction based on the account's external wallet type. If the
 * account has an external wallet (Ledger Nano S/X or XUMM), it signs the transaction using the corresponding method. If
 * the account does not have an external wallet, it signs the transaction using the account's seed. The function first
 * checks if the account has an external wallet, and if so, it uses the appropriate signing method. If the account does
 * not have an external wallet, it checks if the account seed is encrypted and retrieves the signing wallet accordingly.
 * Finally, it signs the transaction and returns the signed transaction blob and hash.
 * 
 * @param {object} transaction - The transaction object to be signed.
 * @param {object} account - The account object containing information about the user's account.
 * @param {object} txOptions - The transaction options object containing settings for the transaction process.
 * @returns {Promise<Object>} - An object containing the result of the signing process, a message, and the signed
 * transaction blob and hash if successful.
 * @throws {Error} - Throws an error if there is a problem handling the transaction signing.
 */
export const handleTransactionSigning = async(transaction,account,txOptions)=>{
    try
    {
        if(account.externalWallet) 
        {
            switch(account.externalWallet)
            {
                case 'Ledger Nano S/X':
                    return await signTxWithLedger(account,transaction)
                case 'XUMM':
                    //let spinner = await createSpinner(`Waiting for you to handle the transaction in Xumm...`)
                    let payloadResponse = await createAndSubscribeToPayload(transaction,{instruction:txOptions.txMessage})
                   // spinner.stop()
                    return payloadResponse
            }
        }
        else
        {
            let signingWallet
            if(account.seedEncrypted) signingWallet = await getWalletFromEncryptedSeed(account.address,account.seed)
            else signingWallet= xrpl.Wallet.fromSeed(account.seed)
            if(!signingWallet) return {result:'failed',message:'Could not get signing wallet.'}
            else
            {
                let signedTx= signingWallet.sign(transaction)
                let {tx_blob,hash} = signedTx
                return {result:'success',message:'Transaction signed.',tx_blob:tx_blob,hash:hash}
            }
        }
    }
    catch(err)
    {
        console.log('There was a problem handling the transaction signing: ',err)
    }
}


/**
 * @function transactionHandler
 * @description
 * Handles the entire transaction process including autofilling, signing, submitting, and verifying the
 * transaction. It also logs the transaction if the settings are configured to do so. The function first retrieves the
 * settings from the configuration handler and initializes the necessary variables. It then proceeds to autofill the
 * transaction with the required fields (flags, fee, LastLedgerSequence, and Sequence). If autofilling is successful, it
 * prompts the user to confirm the transaction details (if configured to do so) and proceeds to sign the transaction
 * using the handleTransactionSigning function. After signing, it submits the transaction to the network RPC and logs
 * the transaction if configured. If the transaction submission is successful, it verifies the transaction result (if
 * configured to do so) and returns the transaction result, hash, and code.
 * 
 * @param {string} networkRPC - The network RPC URL to submit the transaction to.
 * @param {object} transaction - The transaction object to be processed.
 * @param {object} account - The account object containing information about the user's account.
 * @param {object} txOptions - The transaction options object containing settings for the transaction process.
 * @returns {Promise<Object>} - An object containing the result of the transaction process, a message, and the
 * transaction result, hash, and code if successful.
 * @throws {Error} - Throws an error if there is a problem handling the transaction.
 */
export const transactionHandler = async(networkRPC,transaction,account,txOptions)=>{
        let settings= await configHandler.getConfigs(`XTOKENIZE_SETTINGS`)
        let {max_fee,fee_cushion,max_ledger_offset,log_transactions} = settings
        let{verify,verbose,txMessage,askConfirmation} = txOptions
        let wallet,spinner
        try
        {
            log_transactions?log.addLog(`info`,`Transaction Handler started.`):null

            spinner = verbose?await createSpinner(`Autofilling the tx...`):null
            log_transactions?log.addLog(`info`,`Autofilling transaction....`):null

            let autofilled= await autofillTransaction(networkRPC,transaction,max_fee,fee_cushion,max_ledger_offset)
            if(autofilled.result==='success')
            {
                log_transactions?log.addLog(`info`,`Transaction Autofilled: ${JSON.stringify(autofilled)}`):null

                let tx = autofilled.tx
                if(verbose)
                {
                    spinner.stop()
                    infoMessage(`Autofilled ${tx.TransactionType} Transaction:`)
                    console.log(tx)
                    console.log()
                }
                let confirmed = askConfirmation? await askYesNo(`Are the transaction details correct?`,true):true
                if(!confirmed)
                {
                    log_transactions?log.addLog(`warn`,`Transaction submission declined.`):null
                    return {result:'warn',message:'User declined the transaction.'}
                } 
                else
                {
                    log_transactions?log.addLog(`info`,`Transaction approved.`):null
                    log_transactions?log.addLog(`info`,`Signing the transaction.`):null
                    let lastLedgerSequence = tx.LastLedgerSequence

                    let signedTxResult = await handleTransactionSigning(tx,account,txOptions)
                    if(signedTxResult.result !=='success') return signedTxResult
                    else
                    {
                        if(verbose) spinner.start()
                        let {tx_blob,hash} = signedTxResult
                        if(verbose) spinner.message(`Submitting the transaction...`)
                        log_transactions?log.addLog(`info`,`Submitting transaction with hash ${hash}.`):null
                        let submissionResult = await submitRequest({"method":"submit","params":[{"tx_blob":tx_blob}]},networkRPC)
                        if(log_transactions) await logTransaction(submissionResult,networkRPC)
                        if(submissionResult.engine_result ==='tesSUCCESS')
                        {
                            log_transactions?log.addLog(`info`,`Transaction submission preliminary result is tesSUCCESS.`):null
                            if(verify)
                            {
                                log_transactions?log.addLog(`info`,`Verifying the transaction.`):null
                                if(verbose) spinner.message(`Verifying the transaction result...`)
                                let verified = await verifyTransactionResult(networkRPC,hash,lastLedgerSequence,log_transactions)
                                log_transactions?log.addLog(`info`,`Transaction with hash ${verified.hash} verified with transaction result ${verified.code}.`):null
                                if(verbose) spinner.stop()
                            
                                return verified
                            }
                            else
                            {
                                if(verbose) spinner.stop()
                                log_transactions?log.addLog(`info`,`TxOptions are set to not verify the transaction results.`):null
                                return {result:'success',message:'Transaction is presumed to be successful.',tx:submissionResult,hash:hash, code:"tesSUCCESS"}
                            }
                        }
                        else
                        {
                            if(verbose)
                            {
                                spinner.stop()
                                errorMessage(`There was a problem submitting the transaction...`)
                                warningMessage(`Transaction preliminary result: ${submissionResult?.engine_result}`)
                                warningMessage(`Transaction preliminary result message: ${submissionResult?.engine_result_message}`)
                                await pressAnyKey()
                            } 
                            submissionResult && log_transactions?log.addLog(`error`,`Transaction with hash ${hash} has failed with transaction result: ${submissionResult.engine_result}.`):null
                            submissionResult && log_transactions?log.addLog(`error`,`Engine result message: ${submissionResult?.engine_result_message}.`):null
                            return {result:'failed',message:`There was a problem submitting the transaction.`,tx:submissionResult,hash:hash, code:submissionResult.engine_result}
                        }
                    }
                }
            }
            else
            {
                if(verbose)
                {
                    spinner.stop()
                    if(autofilled.reason) errorMessage(autofilled.reason)
                    else
                    { 
                        autofilled.tx.Flags===undefined?errorMessage(`Failed to set transaction flags.`):null;
                        autofilled.tx.Fee===undefined?errorMessage(`Failed to set transaction fee.`):null;
                        autofilled.tx.LastLedgerSequence===undefined?errorMessage(`Failed to set transaction LastLedgerSequence.`):null;
                        autofilled.tx.Sequence===undefined?errorMessage(`Failed to set transaction Sequence.`):null;

                    }
                    await pressAnyKey()
                }
                log_transactions?log.addLog(`error`,`Failed to autofill the transaction.`):null
                log_transactions?log.addLog(`error`,`Autofill result:${JSON.stringify(autofilled)}`):null


                return {result:'warn',message:'There was a problem autofilling the transaction.'}
            }
            
        }
        catch(err)
        {
            if(verbose)
            {
                spinner.stop()
                log_transactions?log.addLog(`error`,`Error thrown in transaciton handler... Not specifying to protect sensitive information.`):null
                errorMessage(`There was a problem handling the transaction: `)
                err.data?console.log(err.data):console.log(err)
                
                await pressAnyKey()
            }
            return {result:'failed',message:'There was a problem handling the transaction.',error:err}
        }
}