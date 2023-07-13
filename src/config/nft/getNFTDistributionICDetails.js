import { askForTextInput,askForNumberMinMax, } from "../../utils/index.js"

/**
 * @function getNFTDistributionICDetails
 * @description
 * This function prompts the user to enter the details of the Issued Currency (IC) they would like to
 * accept for NFT distribution. It asks for the currency code, issuer, and either the payment amount or trustline
 * balance depending on the payment parameter. The function then converts the currency code to its hexadecimal
 * representation and returns an object containing the entered details.
 * 
 * @param {boolean} payment - Indicates whether the user is prompted for a payment amount (true) or trustline balance (false).
 * @returns {Object} - An object containing the entered IC details.
 * @property {string} currencyCode - The currency code of the IC to accept.
 * @property {string} currencyHex - The hexadecimal representation of the currency code.
 * @property {string} issuer - The issuer of the IC to accept.
 * @property {number} amount - The payment amount or trustline balance of the IC to accept, depending on the
 * payment parameter.
 * @throws {Error} - If there is an issue with user input or data conversion.
 */
export const getNFTDistributionICDetails= async(payment)=>{
    let currencyCode = await askForTextInput(`Enter the currency code of the IC you would like to accept (CASE SENSIITVE):`)
    let issuer = await askForTextInput(`Enter the issuer of the IC you would like to accept (CASE SENSIITVE):`)
    let currencyHex = Buffer.from(currencyCode).toString('hex').toUpperCase().padEnd(40,'0')
    // let amount = await askForNumberMinMax(`Enter the ${payment?`payment amount`:`trustline balance`} of the IC you would like to accept:`,0,1000000000)
    let amount 
    if(payment) amount = await askForNumberMinMax(`Enter the payment amount of the IC you would like to accept:`,0.0000000000001,1000000000)
    else amount = await askForNumberMinMax(`Enter the trustline balance of the IC you would like to accept:`,0,1000000000)

    return {currencyCode,currencyHex,issuer,amount}
}