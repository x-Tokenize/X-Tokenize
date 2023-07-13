import {getXrpBalance,getSpecificTrustline} from '../../xrpl/index.js'
import { identifyBuySellOffers } from './identifyBuySellOffers.js';
import {dropsToXrp} from 'xrpl'

/**
 * @function getMaximumsForNewFundedOffer
 * @description
 * This function calculates the maximum XRP and Issued Currency (IC) that can be used in a new funded
 * offer. It first retrieves the spendable XRP balance and the specific trustline information for the given currency and
 * issuer. Then, it identifies the buy and sell offers for the account and calculates the maximum XRP and IC that can be
 * used in a new offer by subtracting the amounts in existing offers from the spendable balances.
 * 
 * @param {object} networkRPC - The network RPC object to interact with the XRPL.
 * @param {string} currencyCode - The currency code of the Issued Currency.
 * @param {string} currencyHex - The currency hex code of the Issued Currency.
 * @param {string} issuerAddress - The address of the Issued Currency issuer.
 * @param {string} accountAddress - The address of the account creating the new funded offer.
 * @param {Array} offers - An array of existing offers for the account.
 * @returns {Promise<Object>} - An object containing the result, message, maxXRP, and maxIC properties. The result can
 * be 'success' or 'warn', and the message provides additional information. maxXRP and maxIC are the maximum XRP and
 * Issued Currency that can be used in a new funded offer, respectively.
 * @throws {Error} - Throws an error if there is a problem getting the maximums for a new funded offer.
 */
export const getMaximumsForNewFundedOffer = async(networkRPC,currencyCode,currencyHex,issuerAddress,accountAddress,offers)=>{
        try{

            let xrpBalanceResponse = await getXrpBalance(networkRPC,accountAddress,false);
            let trustlineInfoResponse = await getSpecificTrustline(networkRPC,currencyHex,issuerAddress,accountAddress);
            let spendableXrpBalance = null;
            let spendableICBalance = null;
            let maxXRP = 0;
            let maxIC = 0;
            if(xrpBalanceResponse.result==='success') {
                if(xrpBalanceResponse.spendable>0) spendableXrpBalance = xrpBalanceResponse.spendable
                else spendableXrpBalance =0;
            }
            else return {result:'warn',message:'There was a problem getting the xrp balance.'}

            if(trustlineInfoResponse.result==='success')
            {
                if(Number(trustlineInfoResponse.trustline.balance)>0) spendableICBalance = Number(trustlineInfoResponse.trustline.balance)
                else spendableICBalance = 0;
            }
            else spendableICBalance = 0;

            if(spendableICBalance!==null && spendableXrpBalance!==null)
            {
                let identifiedOffers
                if(offers && offers.length>0)
                {
                    identifiedOffers = identifyBuySellOffers(offers)
                    let xrpInOffers = 0;
                    identifiedOffers.buyOffers.map(item=>xrpInOffers=xrpInOffers+Number(dropsToXrp(item.taker_gets)))
                    maxXRP = Number(spendableXrpBalance) - Number(xrpInOffers);

                    let icInOffers = 0;
                    identifiedOffers.sellOffers.map(item=>{icInOffers=icInOffers+Number(item.taker_gets.value)})
                    maxIC = (Number(spendableICBalance)-Number(icInOffers)).toFixed(15)
                }
                else{
                    maxXRP = Number(spendableXrpBalance);
                    maxIC = Number(spendableICBalance);
                } 
                return {result:'success',message:'Successfully got the maximums for a new offer.',maxXRP,maxIC}
            }
            else return {result:'warn',message:'There was a problem getting the maximums for a new offer.'}

        }
        catch(err)
        {
            console.log('There was a problem getting the maximums for a new funded offer: ',err)
        }
}