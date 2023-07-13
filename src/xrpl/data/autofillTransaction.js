import  {xrpToDrops}  from "xrpl";
import { getServerInfo } from "../data/getServerInfo.js";
import { getAccountInfo } from "../data/getAccountInfo.js";
import { setTransactionFlagsToNumber } from "xrpl/dist/npm/models/index.js";


/**
 * @function autofillTransaction
 * @description
 * This function takes a transaction object and automatically fills in the required fields such as Fee,
 * LastLedgerSequence, and Sequence. It retrieves account and server information from the XRPL network and calculates
 * the transaction fee based on the load factor and fee cushion provided. It also sets the transaction flags to their
 * numeric values.
 * 
 * @param {string} networkRPC - The RPC URL of the XRPL network to interact with.
 * @param {object} transaction - The transaction object to be autofilled.
 * @param {number} maxFee - The maximum fee allowed for the transaction.
 * @param {number} fee_cushion - The fee cushion multiplier to be applied to the base fee.
 * @param {number} maxLedgerVersionOffset - The offset to be added to the current validated ledger sequence to set
 * the LastLedgerSequence.
 * @returns {Promise<Object>} - An object containing the result of the autofill operation ('success' or
 * 'failed'), the autofilled transaction object, and a reason for failure if applicable.
 * @throws {Error} - Throws an error if there is a problem autofilling the transaction.
 */
export const autofillTransaction = async(networkRPC,transaction,maxFee,fee_cushion,maxLedgerVersionOffset)=>{
    try{

        let accountInfoResponse = await getAccountInfo(networkRPC,transaction.Account)
        if(accountInfoResponse.result !=='success') return {result:'failed',message:`Failed to get account info for account ${transaction.Account} to autofill transaction.`,reason:accountInfoResponse.message}
        else
        {
            let serverInfoResponse = await getServerInfo(networkRPC)
            if(!serverInfoResponse.result === 'success') return {result:'failed',message:'Failed to get server info to autofill transaction.',reason:serverInfoResponse.message}
            else
            {
                let load_factor = serverInfoResponse.serverInfo?.load_factor
                let validated_ledger = serverInfoResponse.serverInfo?.validated_ledger
                if(!load_factor || !validated_ledger) return {autofillResult:'failed',tx:transaction,reason:`Could not get server info to populate transaction details.`}
                else
                {
                    let calculatedFee = Math.floor(xrpToDrops(validated_ledger.base_fee_xrp * load_factor)*fee_cushion).toString()
                    if(Number(calculatedFee)>maxFee && maxFee !=='0') calculatedFee = maxFee.toString()

                    let lastLedgerSequence = validated_ledger.seq +maxLedgerVersionOffset
                    let sequence = accountInfoResponse.account_data.Sequence
    
                    transaction.Fee = calculatedFee;
                    transaction.SourceTag = 14655641; //This value is used to identify transactions that are submitted using X-Tokenize.
                    transaction.LastLedgerSequence = lastLedgerSequence;
                    transaction.Sequence = sequence;
                    setTransactionFlagsToNumber(transaction)
                    if(typeof transaction.Flags!== 'undefined' && typeof transaction.Fee!== 'undefined' && typeof transaction.LastLedgerSequence!=='undefined' && typeof transaction.Sequence!=='undefined') return {result:'success',tx:transaction}
                    else{
                        
                        return {result:'failed',tx:transaction}        
                    } 
                }
            }
        }
    }
    catch(err)
    {
        console.log('There was problem autofilling the transaction: ',err)
    }
}