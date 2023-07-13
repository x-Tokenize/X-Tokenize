import { longRequest } from '../core/requests.js'

 /**
 * @function getOrderbook
 * @description
 * This function retrieves the orderbook for a specific currency and issuer address on the XRPL. It first
 * converts the currency to its hexadecimal representation and creates buy and sell taker objects. Then, it sends two
 * separate requests to the XRPL to get buy and sell offers. Finally, it returns the orderbook containing both buy and
 * sell offers if successful, or a warning message if there was a problem retrieving either buy or sell offers.
 * 
 * @param {string} networkRPC - The network RPC URL to send requests to.
 * @param {string} currency - The currency code for which the orderbook is to be retrieved.
 * @param {string} issuerAddress - The issuer address of the currency for which the orderbook is to be retrieved.
 * @returns {Promise<Object>} - An object containing the result, message, and orderbook data (bids and asks) if
 * successful, or a warning message if there was a problem retrieving either buy or sell offers.
 * @throws {Error} - Throws an error if there was a problem getting the orderbook.
 */
export const getOrderbook = async (networkRPC, currency, issuerAddress) => {
    try 
    {

        const currencyHex =Buffer.from(currency).toString('hex').toUpperCase().padEnd(40,'0')

        let buyTakerPays = {"currency":currencyHex,"issuer":issuerAddress}
        let buyTakerGets = {"currency":"XRP"}

        let sellTakerPays = {"currency":"XRP"}
        let sellTakerGets = {"currency":currencyHex,"issuer":issuerAddress}

        let buyOffersRequest = {
            "method": "book_offers",
            "params": [
                {"taker_gets":buyTakerGets,"taker_pays":buyTakerPays}
            ]
        }

        let sellOffersRequest = {
            "method": "book_offers",
            "params": [
                {"taker_gets":sellTakerGets,"taker_pays":sellTakerPays}
            ]
        }

        let buyOffers = await longRequest("offers",buyOffersRequest,networkRPC)
        let sellOffers =await longRequest("offers",sellOffersRequest,networkRPC)

        if(buyOffers && sellOffers) return {result:'success',message:'Successfully retrieved orderbook.',bids:buyOffers,asks:sellOffers}
        else
        {
            let result
            result = !buyOffers?{result:'warn',message:'There was a problem getting buy offers.'}:{result:'warn',message:'There was a problem getting sell offers.'}
            return result
        }
    }
    catch (err) {
        console.log('There was a problem getting the orderbook: ', err)
    }
    
}