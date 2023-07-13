import { configHandler } from '../configHandler.js'
import { askQuestion, askYesNo, errorMessage, infoMessage, pressAnyKey, printBanner, successMessage, warningMessage } from '../../utils/index.js';
import CryptoJS from 'crypto-js';
import fs from 'fs'
import figlet from 'figlet'
import chalk from 'chalk'
import axios from 'axios';



const formatText = async ( text, maxLineLength) => {
    const words = text.split(' ');
    let currentLineLength = 0;
    let formatted = '';
    printBanner()
    formatted += '\n';
    for (let word of words) {
        if(currentLineLength + word.length > maxLineLength){
            formatted += '\n'
            currentLineLength = 0
        }
            if(word.includes(':')){
                word = `${word}\n\n`
                currentLineLength = 0
                let endOfLastSentence = formatted.lastIndexOf('.')
                if(endOfLastSentence > 0){
                    formatted = formatted.slice(0,endOfLastSentence+1) + '\n\n' + formatted.slice(endOfLastSentence+1)
                }
            }
            formatted += ` ${word}`
            currentLineLength += word.length+1
    }
    return formatted.trim();
}



export const acknowledgeTaC = async()=>{
    try{

    let settings = await configHandler.getConfigs('XTOKENIZE_SETTINGS')
    let terms = await axios.get('https://www.x-tokenize.com/Terms-And-Conditions.pdf')
    let termsHash = CryptoJS.SHA256(terms.data).toString()

    if(settings.terms.agreed ===false || settings.terms.TermsAndConditionsHash !== termsHash){

        errorMessage(` You must acknowledge the Terms and Conditions before using X-Tokenize.`)
        infoMessage(` The terms can be found at:\n\n https://www.x-tokenize.com/Terms-And-Conditions.pdf\n`)
        console.log()
        let acknowledged = await askYesNo('Do you acknowledge that you have read, understand and agree to the complete Terms and Conditions?',false)
        if(!acknowledged){ process.exit()}
        else
        {
            console.clear()
            settings.terms.TermsAndConditionsHash = termsHash
            settings.terms.agreed = true
            configHandler.XTOKENIZE_SETTINGS.set(settings)
            successMessage(`The Terms and Conditions have been acknowledged.`)
            infoMessage(`Please launch X-Tokenize again to continue.`)
            await pressAnyKey()
            process.exit(1)
            //return true
        }
    }
    else return true
}
catch(err)
{
    console.log(err)
    return false
}
}