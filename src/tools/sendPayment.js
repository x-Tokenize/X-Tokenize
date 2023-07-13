import { selectAConfigAccountWithNetwork,askWhichFromList,askForAddress,askForNumberMinMax,infoMessage, warningMessage} from "../utils/index.js"
import { checkAccountExists, getAccountLines, getXrpBalance, sendXRP, sendIssuedCurrency} from "../xrpl/index.js"
import xrpl from 'xrpl'

 /**
 * @function sendPayment
 * @description
 * This function is responsible for sending a payment in the form of XRP or Issued Currency (IC) from a
 * user's account to a destination address. The function first selects a configuration account with the network, checks
 * if the account exists, and then prompts the user to choose the type of payment (XRP or Issued Currency). If the user
 * chooses Issued Currency and the account is an issuer, the function returns a warning message. Otherwise, the function
 * proceeds to determine the spendable balance of the chosen currency, prompts the user to input the amount to send and
 * the destination address, and finally sends the payment using the appropriate transaction method (sendXRP or
 * sendIssuedCurrency) based on the chosen currency.
 * 
 * @param {string} config_type - The type of configuration account to be used for the payment.
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the sent payment.

 * @throws {Error} - If there is a problem during the payment process.
 */

export const sendPayment = async(config_type)=>{
    try
    {
        let configAcountNetworkResult = await selectAConfigAccountWithNetwork(config_type)
        if(configAcountNetworkResult.result!=='success') return configAcountNetworkResult
        else
        {
            let {account,networkRPC,network} = configAcountNetworkResult
            let accountExistsResult = await checkAccountExists(network,networkRPC,account.address)
            if(accountExistsResult.result!=='success') return accountExistsResult
            else
            {
                let paymentType= await askWhichFromList(`What kind of payment would you like to send?`,['XRP','Issued Currency','Cancel'])
                
                if(paymentType==='Cancel') return {result:'warn',message:`User cancelled payment selection.`}
                else if(paymentType==='Issued Currency' && account.name==='Issuer') return {result:'warn',message:`The issuer of an IC should not send IC this way. Use the treasury or operational wallet.`}
                else
                {
                    let spendable,currency,currencyHex,issuer,destination,amount
                    switch(paymentType)
                    {
                        case 'XRP':
                            let xrpBalanceResponse = await getXrpBalance(networkRPC,account.address)
                            if(xrpBalanceResponse.result!=='success') return xrpBalanceResponse
                            else
                            {
                                currency='XRP'
                                spendable = xrpBalanceResponse.spendable
                            }
                            break
                        case 'Issued Currency':
                            let accountLinesResponse = await getAccountLines(networkRPC,account.address)
                            if(accountLinesResponse.result!=='success') return accountLinesResponse
                            else
                            {
                                let {lines} = accountLinesResponse;
                                if(lines.length===0) return {result:'warn',message:`There are no issued currencies to send.`}
                                else
                                {
                                    let currencyBalances = []
                                    lines.forEach(line=>{if(Number(line.balance)>0) currencyBalances.push({currency:line.currency.length>3?xrpl.convertHexToString(line.currency):line.currency,balance:Number(line.balance),issuer:line.account})})
                                    if(currencyBalances.length===0) return {result:'warn',message:`There were no issued currencies with a positive balance found.`}
                                    else
                                    {
                                        let options = currencyBalances.map(currency=>currency.currency)
                                        options.push('Cancel')
                                        let currencyToSend = await askWhichFromList(`Which issued currency would you like to send?`,options)
                                        if(currencyToSend==='Cancel') return {result:'warn',message:`User cancelled payment.`}
                                        else
                                        {
                                            let selectedCurrency = currencyBalances.find(currency=>currency.currency===currencyToSend)
                                            currency = selectedCurrency.currency
                                            currencyHex = xrpl.convertStringToHex(currency)
                                            issuer = selectedCurrency.issuer
                                            spendable = Number(selectedCurrency.balance)
                                        }
                                    }
                                }
                            }
                            break;
                    }
               
                    amount = await askForNumberMinMax(`How much $${currency} would you like to send?(0:Cancel) (Max:${spendable})`,0,spendable)
                    if(amount===0) return {result:'warn',message:`User cancelled payment.`}
                    else
                    {
                        destination = await askForAddress(`What is the destination address? (0:Cancel)`)
                        if(destination==='0') return {result:'warn',message:`User cancelled payment.`}
                        else
                        {
                            let txOptions = {verbose:true,verify:true,txMessage:null,askConfirmation:true}
                            if(currency ==='XRP') return await sendXRP(networkRPC,account,destination,xrpl.xrpToDrops(amount),txOptions)
                            else return await sendIssuedCurrency(networkRPC,account,destination,currency,{currency:currencyHex,issuer:issuer,value:amount.toString()},txOptions)
                        }
                    }
                }
            }

        }
    }
    catch(err)
    {

        console.log(`There was a problem sending a payment: ${err}`)
    }
}