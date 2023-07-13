import {getAllTrustlinesToAnIssuer} from './getAllTrustlinesToAnIssuer.js'

/**
 * @function getIssuedCurrencyCirculatingSupply
 * @description
 * This function calculates the circulating supply of an issued currency on the XRPL by fetching all
 * trustlines to the issuer address and summing up the balances of the trustlines with the specified currency. It uses
 * the getAllTrustlinesToAnIssuer function to retrieve the trustlines.
 * 
 * @param {string} networkRPC - The network RPC URL to connect to the XRPL.
 * @param {string} issuerAddress - The issuer address of the issued currency.
 * @param {string} currencyHex - The currency code in hexadecimal format.
 * @returns {Promise<Object>} - An object containing the result, message, and circulatingSupply properties. The result
 * can be 'success', 'warn', or an error. The message provides a description of the result, and the circulatingSupply is
 * the calculated circulating supply of the issued currency.
 * @throws {Error} - Throws an error if there is a problem getting the issued currency circulating supply.
 */

export const getIssuedCurrencyCirculatingSupply = async (networkRPC, issuerAddress, currencyHex) => {
        try
        {
            let trustlineResponse = await getAllTrustlinesToAnIssuer(networkRPC,issuerAddress)
            if(trustlineResponse.result==='success')
            {
                let lines = trustlineResponse.lines
                let totalBalance = 0
                for(let i=0;i<lines.length;i++)
                {
                    let line = lines[i]
                    if( line.currency && line.currency===currencyHex)
                    {
                        totalBalance+=Number(line.balance)
                    }
                }
                return {result:'success',message:'The issued currency circulating supply was retrieved successfully.',circulatingSupply:Math.abs(totalBalance)}
            }
            else 
            {
                return {result:'warn',message:`Could not retrieve the issued currency circulating supply.`}
            }
        }
        catch(err)
        {
            console.log('There was a problem getting the issued currency circulating supply:',err)
        }
}