import { askForTextInput,askYesNo,askQuestion,askForNumberMinMax } from "../../utils/index.js"


/**
 * @function getICCurrencyConfig
 * @description
 * This function prompts the user to input various configuration settings for an issued currency. It asks
 * for the currency code, whether it has a fixed supply, the total supply, and if it has already been minted. If the
 * currency has already been minted, it also asks for the estimated circulating supply. The function returns an object
 * containing the configuration settings.
 * 
 * @returns {CurrencyConfigResult} - An object containing the result of the operation, a message, and (if successful) the currency configurations.
 * @throws {Error} - If there is a problem getting the issued currency configurations.
 */
export const getICCurrencyConfig = async()=>{
    try{
        const currencyCode  = await askForTextInput('Enter the currency code (CASE SENSITIVE):')
        const currencyHex =Buffer.from(currencyCode).toString('hex').toUpperCase().padEnd(40,'0')
        const maxSupply = "999999999999999900000000000000000000000000000000000000000000000000000000000000000000000000000000"
        let supply
        const fixedSupply = await askYesNo('Is this a fixed supply currency?',true)
        if(!fixedSupply) supply=maxSupply
        else{
            supply = await askQuestion({
                type:'input',
                message:'Enter the total supply:',
                validate:(value)=>{return value.includes(' ')|| isNaN(Number(value))|| value.length>maxSupply.length-1 || Number(value)<=0? `Supply must be a number that is greater than 0 and less than ${maxSupply}` : true}
        })
        }
        const alreadyMinted = await askYesNo('Has this currency already been minted?',false)
        let estimatedCirculatingSupply = 0
        if(alreadyMinted)
        {
            estimatedCirculatingSupply = await askForNumberMinMax('Enter the estimated circulating supply (this will be updated when attempting to mint more):',0,Number(supply)) 
        }
        return{result:'success',message:'Currency configurations set',currencyCode:currencyCode,currencyHex:currencyHex,fixedSupply:fixedSupply,totalSupply:supply,circulatingSupply:estimatedCirculatingSupply,isMinted:alreadyMinted}
    }
    catch(err)
    {
        console.log('There was a problem getting the issued currency configurations: ',err)
        return{result:'warn',message:'No issued currency configurations set'}
    }
}