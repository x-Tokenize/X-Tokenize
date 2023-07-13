import chalk from 'chalk';
import {dropsToXrp} from 'xrpl';
import {table, errorMessage, infoMessage,warningMessage,successMessage} from '../../utils/index.js';
import { identifyBuySellOffers } from "./identifyBuySellOffers.js"
import { offerDataCreator } from "./offerDataCreator.js"

/**
 * @function printOrderbook
 * @description
 * Prints the orderbook for a given currency code and issuer address, including bids and asks. Displays
 * the trading pair, issuer, token asks, spot price, and token bids in a formatted table.
 * 
 * @param {string} currencyCode - The currency code of the token.
 * @param {string} issuerAddress - The issuer address of the token.
 * @param {Array} bids - An array of bid objects.
 * @param {Array} asks - An array of ask objects.
 * @returns {void}
 */
export const printOrderbook = (currencyCode,issuerAddress,bids,asks) =>
{
    let sellData = []
    let buyData =[]
    if(bids.length === 0 && asks.length === 0) console.log(chalk.redBright.bold(`There are no active buy or sell orders for ${currencyCode}`))
    else
    {
       infoMessage(`Trading Pair: ${currencyCode}-XRP`)
       infoMessage(`Issuer: ${issuerAddress} `)
        if(asks.length>0)
        {
            for(let i = asks.length-1;i>=0;i--)
            {
                let sellPrice = (Number(dropsToXrp(asks[i].TakerPays))/Number(asks[i].TakerGets.value))
                let roundedSellPrice = Math.round(sellPrice*1000000)/1000000
                let liquidity = asks[i].TakerGets.value*roundedSellPrice
                sellData.push({size:asks[i].TakerGets.value,price:roundedSellPrice,liquidity:liquidity})
            }
            errorMessage(`TOKEN ASKS`)
            table(sellData,'red')
        }
        else errorMessage(`There are no active sell orders for ${currencyCode}`)

        if(bids.length>0)
        {
            for(let i = 0;i<bids.length;i++)
            {
                let buyPrice = (Number(dropsToXrp(bids[i].TakerGets))/Number(bids[i].TakerPays.value))
                let roundedBuyPrice = Math.round(buyPrice*1000000)/1000000
                let liquidity = bids[i].TakerPays.value*roundedBuyPrice
                buyData.push({size:bids[i].TakerPays.value,price:roundedBuyPrice,liqudity:liquidity})
            }
        }

        if(asks.length>0 &&bids.length>0)
        {
            console.log(chalk.whiteBright.bold('SPOT:',(sellData[sellData.length-1].price+buyData[0].price)/2), ' XRP')
            console.log()
            console.log()
        }
        if(bids.length>0)
        {
            successMessage(`TOKEN BIDS`)
            table(buyData,'green')
        }else successMessage(`There are no active buy orders for ${currencyCode}`)
    }
    return
}

/**
 * @function printOffers
 * @description
 * Prints the active offers for a given currency code and issuer address. Displays account active sell
 * offers and account active buy offers in a formatted table.
 * 
 * @param {Array} offers - An array of offer objects.
 * @param {string} issuerAddress - The issuer address of the token.
 * @param {string} currencyCode - The currency code of the token.
 * @returns {void}
 * @throws {Error} - If there is a problem viewing the treasury offers.
 */

export const printOffers = (offers,issuerAddress,currencyCode)=>{
    try
    {
        if(offers.length>0)
        {
            let identifiedOffers=identifyBuySellOffers(offers)
            if(identifiedOffers.buyOffers.length>0||identifiedOffers.sellOffers.length>0)
            {
                let usefulSellOffers = offerDataCreator(identifiedOffers.sellOffers,issuerAddress,currencyCode)
                let usefulBuyOffers = offerDataCreator(identifiedOffers.buyOffers,issuerAddress,currencyCode)

                if(usefulSellOffers.length===0) errorMessage(`Account has no active sell offers for $${currencyCode}.`)
                else {
                    errorMessage(`ACCOUNT ACTIVE SELL OFFERS`)
                    table(usefulSellOffers,'red')
                }
                console.log()
                
                if(usefulBuyOffers.length===0) warningMessage(`Account has no active buy offers for $${currencyCode}.`) 
                else {
                    successMessage(`ACCOUNT ACTIVE BUY OFFERS`)
                    table(usefulBuyOffers,'green')
                }
            }
        }
        else errorMessage(`This account has no active offers for $${currencyCode}.`)   
        console.log()
        console.log()
        return
    }
    catch(err)
    {
        console.log(`There was a problem viewing the treasury offers: ${err}`)
    }
}

/**
 * @function printOrderbookAndOffers
 * @description
 * Prints the orderbook and active offers for a given currency code and issuer address. Calls the
 * printOrderbook and printOffers functions to display the information in a formatted table.
 * 
 * @param {string} currencyCode - The currency code of the token.
 * @param {string} issuerAddress - The issuer address of the token.
 * @param {Array} bids - An array of bid objects.
 * @param {Array} asks - An array of ask objects.
 * @param {Array} offers - An array of offer objects.
 * @returns {boolean} - Returns true after successfully printing the orderbook and active offers.
 */
export const printOrderbookAndOffers = (currencyCode,issuerAddress,bids,asks,offers)=>{
    printOrderbook(currencyCode,issuerAddress,bids,asks)
    printOffers(offers,issuerAddress,currencyCode)
    return true
   
}