import inquirer from 'inquirer';
import xrpl from 'xrpl'
import {getAccountsAndNetworkRelatedToConfig} from '../../config/misc/getAccountsAndNetworkRelatedToConfig.js'

 /**
 * @function askQuestion
 * @description
 * Asks the user a question using the inquirer package and returns the user's answer. The question object
 * should contain the necessary properties for the inquirer prompt.
 * 
 * @param {Object} question - The question object containing the necessary properties for the inquirer prompt.
 * @returns {Promise<string|number|boolean>} - The user's answer to the question.
 */
export const askQuestion = async (question)=>{
    try
    {
        let {type,name,message,choices,defaultSetting,validate} = question;
        let pageSize
        !name?name='answer':null;
        choices?pageSize=choices.length:null;
        let {answer} = await inquirer.prompt({type,name,message,choices,validate,default:defaultSetting,pageSize:pageSize})
        return answer
    }
    catch(err)
    {
        console.log(`There was a problem asking a question: `,err)
    }
}


/**
 * @function askWhichFromList
 * @description
 * Asks the user to select an item from a list of choices using the inquirer package and returns the
 * user's selection.
 * 
 * @param {string} question - The question to ask the user.
 * @param {Array} choices - The list of choices for the user to select from.
 * @returns {Promise<any>} - The user's selected choice from the list.
 */
export const askWhichFromList = async(question,choices)=>{
        try{
            let answer = await askQuestion({type:'list',message:question,choices:choices})
            return answer
        }
        catch(err)
        {
            console.log('There was a problem asking which from list: ',err)
        }
}

/**
 * @function askWhichFromCheckbox
 * @description
 * Asks the user to select one or more items from a list of choices using the inquirer package and returns
 * the user's selections.
 * 
 * @param {string} question - The question to ask the user.
 * @param {Array} choices - The list of choices for the user to select from.
 * @returns {Promise<Array>} - The user's selected choices from the list.
 */
export const askWhichFromCheckbox = async(question,choices)=>{
        try{
            let answer = await askQuestion({type:'checkbox',message:question,choices:choices,
            validate:(value)=>{
                if(value.length === 0) return 'You must select at least one criteria.'
                else return true
            }})
            return answer
        }
        catch(err)
        {
            console.log('There was a problem asking which from checkbox: ',err)
            
        }
}

/**
 * @function askForTextInput
 * @description
 * Asks the user for a text input using the inquirer package and returns the user's input. The input must
 * not contain spaces.
 * 
 * @param {string} question - The question to ask the user.
 * @returns {Promise<string>} - The user's text input.
 */
export const askForTextInput = async(question)=>{
        try{
            let answer = await askQuestion({type:'input',message:question,validate:(input)=>{
                if(input.length==0) return 'You must enter a value'
                if(input.indexOf(' ')>=0) return 'Please provide and input without spaces'
                else return true
            }})
            return answer
        }
        catch(err)
        {
            console.log('There was a problem asking for text input: ',err)
        }
}

/**
 * @function askForNumberMinMax
 * @description
 * Asks the user for a number input within a specified range using the inquirer package and returns the
 * user's input.
 * 
 * @param {string} question - The question to ask the user.
 * @param {number} min - The minimum value allowed for the input.
 * @param {number} max - The maximum value allowed for the input.
 * @returns {Promise<number>} - The user's number input within the specified range.
 */
export const askForNumberMinMax = async(question,min,max)=>{
        try{
            let answer = NaN
            while(isNaN(answer))
            {
                answer = await askQuestion({type:'input',message:question,validate:async (input)=>{
                    if(isNaN(input)) return 'You must enter a number'
                    else if(input.length===0) return 'You must enter a value'
                    else if(Number(input)<min) return `You must enter a number greater than ${min}`
                    else if(Number(input)>max) return `You must enter a number less than ${max}`
                    else return true
                }})
            }
                return answer
        }
        catch(err)
        {
            console.log('There was a problem askingForNumberMinMax: ',err)
        }
}

/**
 * @function askYesNo
 * @description
 * Asks the user a yes or no question using the inquirer package and returns the user's answer as a boolean.
 * 
 * @param {string} message - The question to ask the user.
 * @param {boolean} defaultSetting - The default answer for the question.
 * @returns {Promise<boolean>} - The user's answer to the yes or no question.
 */
export const askYesNo = async(message,defaultSetting)=>{
        try{
            let answer = await askQuestion({type:'confirm',message:message,defaultSetting:defaultSetting})
            return answer
        }
        catch(err)
        {
            console.log('There was a problem asking the question: ',err)
        }
}

/**
 * @function askPassword
 * @description
 * Asks the user for a password using the inquirer package and returns the user's input. The password must
 * be at least 8 characters long.
 * 
 * @param {string} accountAddress - The account address associated with the password.
 * @returns {Promise<string>} - The user's password input.
 */
export const askPassword = async(accountAddress)=>{
        try{
            let password = await askQuestion({
                type:'input',
                message:`Please provide the pasword for this account (${accountAddress}):`,
                validate: (value) => {
                    if (value.length < 8) {
                        return 'Password must be at least 8 characters long.';
                    }
                    return true;
                }
             })
             return password
        }
        catch(err)
        {
            console.log('There was a problem getting the passworkd:',err)
        }
}

/**
 * @function askPin
 * @description
 * Asks the user for a pin using the inquirer package and returns the user's input. The pin must be a 4 to
 * 6 digit number.
 * 
 * @param {string} accountAddress - The account address associated with the pin.
 * @returns {Promise<string>} - The user's pin input.
 */
export const askPin = async(accountAddress)=>{
        try{
            let pin = await askQuestion({
                type:'input',
                message:`Please provide the pin for this account (${accountAddress}):`,
                validate: (value) => {
                    if(Number(value) && value.length>3 && value.length<7)
                    {
                        return true;
                    }
                    else{
                        return 'Please enter a 4 to 6 digit pin:'
                    }
                }
             })
             return pin
        }
        catch(err)
        {
            console.log('There was a problem getting the pin:',err)
        }
}

/**
 * @function askForAddress
 * @description
 * Asks the user for an XRPL address using the inquirer package and returns the user's input. The input
 * must be a valid XRPL address.
 * 
 * @returns {Promise<string>} - The user's XRPL address input.
 */
export const askForAddress = async()=>{
    try
    {
        let address = await askQuestion({type:'input',message:'Enter the address (0:Cancel):',validate:(value)=>{
            if(value.length===0) return 'Please enter a value.'
            else if (value==='0') return true
            else if(xrpl.isValidAddress(value)===false) return 'Please enter a valid address.'
            else return true
        }})
        return address
    }
    catch(err)
    {
        console.log('There was a problem asking for an address: ',err)
    }
}

/**
 * @function selectAConfigAccountWithNetwork
 * @description
 * Asks the user to select an account from a list of configured accounts and returns the selected account
 * along with its associated network information.
 * 
 * @param {string} type - The type of account to select from the list of configured accounts.
 * @returns {Promise<Object>} - An object containing the selected account and its associated network information.
 */
export const selectAConfigAccountWithNetwork = async(type)=>{
    try
    {
        let accountAndNetworkResult = await getAccountsAndNetworkRelatedToConfig(type)
        if(accountAndNetworkResult.result!=='success') return accountAndNetworkResult
        else
        {
            let {accounts,networkRPC,network} = accountAndNetworkResult
            let accountNames = accounts.map(account=>account.name)
            accountNames.push('cancel')

            let selectedAccount = await askWhichFromList(`Which account would you like to use?`,accountNames)
            if(selectedAccount==='cancel') return {result:'warn',message:`User cancelled account selection.`}
            else
            {
                let account = accounts.find(account=>account.name===selectedAccount)
                return {result:'success',message:'Successfully retrieved account and network information.',account,networkRPC,network}
            }
        }
    }
    catch(err)
    {
        console.log('There was a problem selecting a config account with its associated network network: ',err)
    }

}


/**
 * @function askCurrencyInfo
 * @description
 * Asks the user for currency information including currency code and issuer address, and returns the
 * entered information as an object.
 * 
 * @returns {Promise<Object>} - An object containing the entered currency information.
 */
export const askCurrencyInfo = async()=>{
        try{
            let enteredCurrencyCode,hex,enteredCurrencyIssuer;
             enteredCurrencyCode  = await askForTextInput('Enter the currency code (CASE SENSITIVE) (0:Cancel):')
            if(enteredCurrencyCode==='0') return {result:'warn',message:'User cancelled searching for a currency.'}
            else
            {
                hex =Buffer.from(enteredCurrencyCode).toString('hex').toUpperCase().padEnd(40,'0')
                enteredCurrencyIssuer = await askForTextInput('Enter the currency issuer address (CASE SENSITIVE)(0:Cancel):')
                if(enteredCurrencyCode==='0') return {result:'warn',message:'User cancelled searching for a currency.'}
                else
                {
                    return {result:'success',message:'Successfully retrieved currency info.',enteredCurrencyCode,hex,enteredCurrencyIssuer}
                }
            }
            return({enteredCurrencyCode,hex,enteredCurrencyIssuer})
           }
        catch(err)
        {
            console.log('There was a problem getting the issued currency infop: ',err)
        }
}

/**
 * @function askOfferAmount
 * @description
 * Asks the user for an offer amount using the inquirer package and returns the user's input. The input
 * must be a number within a specified range.
 * 
 * @param {string} message - The question to ask the user.
 * @param {number} max - The maximum value allowed for the input.
 * @returns {Promise<number>} - The user's offer amount input within the specified range.
 */
export const askOfferAmount = async(message,max) =>{
        try{
            let amount = await askQuestion({type:'input',message:message,
            validate:(value)=>{
                if(value.length===0) return 'Please enter a value.'
                else if (isNaN(value)) return 'Please enter a number.'
                else if(Number(value)<0.000001) return `Please enter a number greater than 0.000001.`
                else if (Number(value)>max) return `Please enter a number less than ${max}`
                else return true
                }
            })
            return amount
        }
        catch(err)
        {
            console.log('There was a problem getting the xrp amount: ',err)
        }
}

/**
 * @function pressAnyKey
 * @description
 * Prompts the user to press any key to continue using the inquirer package.
 * 
 * @returns {Promise<undefined>} - A promise that resolves when the user presses any key.
 */
export const pressAnyKey = async()=>{
        await inquirer.prompt({
            type:'input',
            name:'answer',
            message:'Press any key to continue',
        })
        return
}
