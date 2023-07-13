import { getAccountInfo } from './getAccountInfo.js'

 /**
 * @function getXrpBalance
 * @description
 * This function retrieves the XRP balance of a given account address by calling the getAccountInfo
 * function. It calculates the spendable and reserved balances based on the account's owner count and reserves. The
 * function can return the balances in drops or XRP depending on the drops parameter.
 * 
 * @param {string} networkRPC - The network RPC URL to connect to the XRPL.
 * @param {string} accountAddress - The account address for which the XRP balance is to be retrieved.
 * @param {boolean} drops - A boolean flag to indicate if the balance should be returned in drops (true) or
 * XRP (false).
 * @returns {Promise<Object>} - An object containing the result, message, balance, spendable, and reserved balances. If
 * drops is true, the balances are in drops, otherwise, they are in XRP.
 * @throws {Error} - Throws an error if there is a problem checking the config account.
 */
export const getXrpBalance = async(networkRPC, accountAddress,drops) => {
        try {
            let accountInfoResponse = await getAccountInfo(networkRPC, accountAddress)
            if (accountInfoResponse.result==='success'){
                let {account_data}=accountInfoResponse
                let {Balance,OwnerCount} = account_data
                const ACCOUNT_RESERVE = 10000000
                const OWNER_RESERVE = 2000000
                const CUSHION =1000000

                let balance = Number(Balance)
                let reserved = (ACCOUNT_RESERVE + (Number(OwnerCount) * OWNER_RESERVE))

                let spendable = balance - reserved-CUSHION

                if(drops) return {result:'success',message:`The account ${accountAddress} has a balance of ${balance} drops.`,balance:balance,spendable:spendable,reserved:reserved}
                else {
                    let balanceXRP = (Number(balance)/1000000).toFixed(6)
                    let spendableXRP = (spendable/1000000).toFixed(6)
                    let reservedXRP = (reserved/1000000).toFixed(6)
                    return {result:'success',message:`The account ${accountAddress} has a balance of ${balanceXRP} XRP.`,balance:balanceXRP,spendable:spendableXRP,reserved:reservedXRP}
                }
            }
            else {
                if(drops)return {result:'success',message:'Account has not been funded yet',balance:-10000000,spendable:-10000000,reserved:-10000000}
                else{
                    return {result:'success',message:'Account has not been funded yet',balance:-10,spendable:-10,reserved:-10}
                }
            }
        }
        catch (err) {
            console.log('There was a problem checking the config account: ', err)
            reject(err)
        }
}