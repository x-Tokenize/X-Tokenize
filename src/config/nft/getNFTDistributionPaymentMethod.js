import {askWhichFromList, askForNumberMinMax, infoMessage,warningMessage,askYesNo} from '../../utils/index.js'
import {getNFTDistributionICDetails} from './getNFTDistributionICDetails.js'
import { askForConfigWallet } from '../misc/askForConfigWallet.js'

/**
 * @function getNFTDistributionPaymentMethod
 * @description
 * This function is responsible for determining the payment method for NFT distribution. It prompts the
 * user to select a payment method from a list of options, and then configures the payment details accordingly. The
 * function also handles the case for On-Demand Distribution, allowing the user to accept payments on a wallet other
 * than the NFT Treasury Wallet.
 * 
 * @param {string} distributionType - The type of distribution for the NFTs (e.g., 'Simple Distribution', 'Trustline Distribution', 'On-Demand Distribution').
 * @returns {NFTDistributionPaymentMethodResult} - An object containing the result, message, and (if successful) paymentDetails.
 * @throws {Error} - If there is a problem getting the distribution payment method.
 */
export const getNFTDistributionPaymentMethod = async(distributionType)=>{
    try{
        let paymentOptions =['XRP','IC']
        let paymentDetails ={
            paymentType:null,
            paymentCurrency:null,
            paymentHex:null,
            paymentIssuer:null,
            paymentAmount:null,
            paymentAccount:null,
        }
        // if(distributionType ==='Trustline Distribution')
        // {
        //     paymentDetails = this.getPaymentMethodDetails('Trustline')
        //     return {result:'success',message:'Payment method selected.',paymentMethod:'trustline',paymentDetails})
        // }
        if(distributionType==='Simple Distribution') paymentOptions.push('Free')
        paymentOptions.push('Cancel')
        let selectedPaymentMethod = distributionType !=='Trustline Distribution'?await askWhichFromList('Which payment method would you like to use?',paymentOptions):'IC'
        if(selectedPaymentMethod === 'Cancel') return {result:'warn',message:'Payment method selection cancelled.'}
        else
        {
            if(selectedPaymentMethod ==='XRP' || selectedPaymentMethod ==='Free')
            {
                paymentDetails.paymentType = 'XRP'
                paymentDetails.paymentCurrency = 'XRP'
                let amount = selectedPaymentMethod ==='XRP' ? await askForNumberMinMax('How much XRP would you like to distribute these NFTs for?',0.000001,1000000000) : 0
                paymentDetails.paymentAmount = Math.floor(amount*1000000).toString()
            }
            else
            {
                let {currencyCode,currencyHex,issuer,amount} = await getNFTDistributionICDetails((distributionType !=='Trustline Distribution'))
                paymentDetails.paymentType = distributionType !=='Trustline Distribution' ? 'IC' : 'Trustline'
                paymentDetails.paymentCurrency = currencyCode
                paymentDetails.paymentHex = currencyHex
                paymentDetails.paymentIssuer = issuer
                paymentDetails.paymentAmount = amount.toString()
            }
            if(distributionType ==='On-Demand Distribution')
            {
                console.log()
                infoMessage(`With On-Demand Distribution, You can accept payments for NFTs on a wallet other than the NFT Treasury Wallet.`)
                if(await askYesNo(`Would you like to accept payments on a wallet that isn't the NFT Treasury wallet?`,false))
                {
                    let paymentWalletResult = askForConfigWallet()
                    if(paymentWalletResult.result ==='success') paymentDetails.paymentAccount = paymentWalletResult.wallet
                    else warningMessage(`Failed to select payment wallet. Defaulting to NFT Treasury wallet.`)
                }
            }
        }
        return {result:'success',message:'Payment method configured.',paymentDetails:paymentDetails}

    }
    catch(err)
    {
        console.log('There was a problem getting the distribution payment method: ',err)
    }
}