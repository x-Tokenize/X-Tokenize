
/**
 * @function isCurrencyPaymentValid
 * @description
 * Determines if the delivered amount of a currency payment is valid based on the currency type and the
 * expected amount. This function checks for different conditions such as the currency type being XRP or Issued Currency
 * (IC), the delivered amount being a string or an object, and whether the delivered amount meets the expected amount or
 * not. It also considers the possibility of transfer fees on Issued Currencies.
 * 
 * @param {Object} currency - An object containing information about the currency type, amount, hex, and issuer.
 * @param {string|Object} deliveredAmount - The amount delivered in the payment, can be a string for XRP or an
 * object for Issued Currencies.
 * @returns {boolean} - Returns true if the delivered amount is valid based on the conditions, otherwise returns false.
 */
export const isCurrencyPaymentValid = (currency,deliveredAmount)=>{
    let isDeliveredAmountValid = false;
    if(currency.type==='XRP' && typeof deliveredAmount==='string')
    {
        //ADD SETTING HERE TO ALLOW FOR DELIVERED AMOUNTS TO BE LESS THAN THE AMOUNT SENT AT A THRESHOLD DUE TO TRANSFER FEES ON ICS
        if(Number(deliveredAmount)>=Number(currency.amount)) isDeliveredAmountValid = true;
        else isDeliveredAmountValid = false;
    }
    else if(currency.type==='XRP' && typeof deliveredAmount==='object') isDeliveredAmountValid = false;
    else if(currency.type==='IC' && typeof deliveredAmount==='string') isDeliveredAmountValid = false;
    else if(currency.type==='IC' && typeof deliveredAmount==='object')
    {
        if((   deliveredAmount.currency===currency.hex 
            && deliveredAmount.issuer===currency.issuer 
            && Number(deliveredAmount.value)>=Number(currency.amount)))
            {
                isDeliveredAmountValid = true;
            } 
            else isDeliveredAmountValid = false;
    }
    else isDeliveredAmountValid = false;
    return isDeliveredAmountValid;
}
