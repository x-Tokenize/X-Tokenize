import { printResponse, infoMessage,} from "../../utils/index.js"
import {getAccountTransactions } from "../../xrpl/index.js"



/**
 * @function getAndFilterPaymentsOnPaymentAccount
 * @description
 * Retrieves incoming payments on the specified payment account address and filters them based on the
 * transaction type, destination, and transaction result.
 * 
 * @param {string} networkRPC - The network RPC URL.
 * @param {string} paymentAccountAddress - The payment account address to retrieve incoming payments from.
 * @param {object} accountTxOptions - The options for retrieving account transactions (ledger_index_min,
 * ledger_index_max, forward).
 * @returns {Promise<Object>} - An object containing the result, message, and an array of incoming payments.
 * @throws {Error} - If there is a problem getting and filtering the payment account.
 */
export const getAndFilterPaymentsOnPaymentAccount = async(networkRPC,paymentAccountAddress,accountTxOptions)=>{
    try{
        infoMessage(`Getting incoming payments on ${paymentAccountAddress}...`)
        let txResponse = await getAccountTransactions(networkRPC,paymentAccountAddress,accountTxOptions)
        printResponse(txResponse)
        console.log()
        if(txResponse.result ==='success')
        {
            let incomingPayments = txResponse.transactions.filter(transaction=>
                (transaction.tx.TransactionType==='Payment' 
                && transaction.tx.Destination===paymentAccountAddress
                && transaction.meta.TransactionResult==='tesSUCCESS'))
            return {result:'success',message:`Successfully got incoming payments`,incomingPayments}
        }
        else return {result:'warn', message:`There was a problem getting incoming payments.`}
        
    }
    catch(err)
    {
        console.log(`There was a problem getting and filtering the payment account: ${err}`)
    }
}

/**
 * @function getAllTransactionsOnDistributionWallet
 * @description
 * Retrieves all transactions on the distribution wallet address and filters them based on the transaction
 * type, destination, and transaction result.
 * 
 * @param {string} networkRPC - The network RPC URL.
 * @param {string} paymentAccountAddress - The payment account address to retrieve incoming payments from.
 * @param {string} address - The distribution wallet address to retrieve transactions from.
 * @param {object} accountTxOptions - The options for retrieving account transactions (ledger_index_min,
 * ledger_index_max, forward).
 * @returns {Promise<Object>} - An object containing the result, message, payments, and other transactions.
 * @throws {Error} - If there is a problem getting all transactions on the distribution wallet.
 */
export const getAllTransactionsOnDistributionWallet =async(networkRPC,paymentAccountAddress,address,accountTxOptions)=>{
    try
    {
        infoMessage(`Getting incoming transactions on ${address}...`)
        let txResponse = await getAccountTransactions(networkRPC,address,accountTxOptions)

        if(txResponse.result ==='success')
        {
            let payments = null
            let otherTxs = null

            if(paymentAccountAddress===null)
            {
                infoMessage(`Getting incoming payments from ${address}...`)
                payments = txResponse.transactions.filter(transaction=>
                    (transaction.tx.TransactionType==='Payment' 
                    && transaction.tx.Destination===address
                    && transaction.meta.TransactionResult==='tesSUCCESS'))
            }
            infoMessage(`Filtering for valid other transactions...`)
            otherTxs= txResponse.transactions.filter(transaction=>{
                return (
                    ((transaction.tx.TransactionType==='NFTokenCreateOffer' &&transaction.tx.Account===address)
                    ||transaction.tx.TransactionType==='NFTokenCancelOffer'
                    ||transaction.tx.TransactionType==='NFTokenAcceptOffer')
                    && transaction.meta.TransactionResult==='tesSUCCESS' ) 
            })
            return {result:'success',message:`Successfully got incoming transactions.`,payments,otherTxs} 
        }
        else return {result:'warn', message:`There was a problem getting incoming transactions.`}
      
    }
    catch(err)
    {
        console.log('There was a problem getting all transaction on the distribution wallet: ',err)
    }
}

/**
 * @function getSortedTransactionsToHandleDistribution
 * @description
 * Retrieves and sorts transactions for handling distribution based on the payment account address,
 * distribution wallet address, and ledger index range.
 * 
 * @param {string} networkRPC - The network RPC URL.
 * @param {string} paymentAccountAddress - The payment account address to retrieve incoming payments from.
 * @param {string} distributionWalletAddress - The distribution wallet address to retrieve transactions from.
 * @param {number} ledgerIndexMin - The minimum ledger index to retrieve transactions from.
 * @param {number} ledgerIndexMax - The maximum ledger index to retrieve transactions from.
 * @returns {Promise<Object>} - An object containing the result, message, and an array of sorted transactions.
 * @throws {Error} - If there is a problem getting the sorted transactions.
 */
export const getSortedTransactionsToHandleDistribution = async(networkRPC,paymentAccountAddress,distributionWalletAddress,ledgerIndexMin,ledgerIndexMax)=>{
    try
    {    
        let incomingPayments = null
        let otherTransactions = null
        //IF USING A PAYMENT ACCOUNT GET INCOMING PAYMENTS FROM THERE OTHER WISE GET ALL TXS FROM WALLET
        let accountTxOptions = {ledger_index_min:ledgerIndexMin,ledger_index_max:ledgerIndexMax,forward:true}
        if(paymentAccountAddress!==null)
        {
            let incomingPaymentsResult = await getAndFilterPaymentsOnPaymentAccount(networkRPC,paymentAccountAddress,accountTxOptions)
            printResponse(incomingPaymentsResult)
            console.log()
            if(incomingPaymentsResult.result==='success')
            {
                incomingPayments = incomingPaymentsResult.incomingPayments
            }
            else incomingPayments =null
            
        }
        if((paymentAccountAddress!==null && incomingPayments!==null) || paymentAccountAddress===null)
        {
            //GET ALL TXS FROM WALLET
            let allTransactionsResult = await getAllTransactionsOnDistributionWallet(networkRPC,paymentAccountAddress,distributionWalletAddress,accountTxOptions)
            printResponse(allTransactionsResult)
            console.log()
            if(allTransactionsResult.result==='success')
            {   
                if(paymentAccountAddress===null) incomingPayments = allTransactionsResult.payments
                otherTransactions=allTransactionsResult.otherTxs
                let mergedTransactions = [...incomingPayments,...otherTransactions]
                let sortedTransactions = mergedTransactions.sort((a,b)=>Number(a.tx.inLedger)-Number(b.tx.inLedger))
                return {result:'success',message:`Successfully got sorted transactions.`,sortedTransactions}
            }
            else return {result:'warn',message:`There was a problem getting incoming payments on the distribution account.`}
        }
        else return {result:'warn',message:`There was a problem getting incoming payments on the payment account.`}
    }
    catch(err)
    {
        console.log(`There was a problem getting the sorted transactions.`,err)
    }
}