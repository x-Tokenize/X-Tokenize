import { dropsToXrp } from "xrpl"

/**
 * @function offerDataCreator
 * @description
 * This function takes in an array of offers, an issuer address, and a currency code, then processes the
 * offers to create an array of cleaned offer data objects. The function first converts the currency code to a
 * hexadecimal string and pads it with zeros. It then iterates through the offers, checking if the taker_gets property
 * is a string or an object. Based on the type of taker_gets, the function determines if the offer is a buy or sell
 * offer and calculates the price per token and total value in XRP. The cleaned offer data objects contain the type (buy
 * or sell), sequence number, token amount, price per token, and total value in XRP.
 * 
 * @param {Array} offers - An array of offer objects to be processed.
 * @param {string} issuerAddress - The address of the issuer for the specified currency.
 * @param {string} currencyCode - The currency code for the issued currency.
 * @returns {Array} - An array of cleaned offer data objects containing the type, sequence number, token
 * amount, price per token, and total value in XRP.
 */
export const offerDataCreator = (offers,issuerAddress,currencyCode)=>{
    const currencyHex =Buffer.from(currencyCode).toString('hex').toUpperCase().padEnd(40,'0')

    let cleaned =[]
    offers.map((item)=>{
        if(typeof(item.taker_gets)==='string')
        {
            if(item.taker_pays.currency == currencyHex && item.taker_pays.issuer==issuerAddress)
            {
                let price = Number(dropsToXrp(item.taker_gets))/Number(item.taker_pays.value)
                let aBuy =
                {
                    type:'buy',
                    seq:item.seq,
                    tokenAmount:item.taker_pays.value+ ` $${currencyCode}`,
                    pricePerToken: price+' $XRP',
                    totalValue:dropsToXrp(item.taker_gets)+' $XRP'
                }
                cleaned.push(aBuy)
            }
        }
        else
        {
            if(item.taker_gets.currency ==currencyHex && item.taker_gets.issuer==issuerAddress)
            {
                let price = Number(dropsToXrp(item.taker_pays))/Number(item.taker_gets.value)
                let aSell =
                {
                    type:'sell',
                    seq:item.seq,
                    tokenAmount:item.taker_gets.value +` $${currencyCode}`,
                    pricePerToken:price+' $XRP',
                    totalValue:dropsToXrp(item.taker_pays)+' $XRP',     
                }
                cleaned.push(aSell)
            }
        }
    })
    
    return cleaned
}