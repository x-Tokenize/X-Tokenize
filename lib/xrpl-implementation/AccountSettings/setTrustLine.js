const chalk = require('chalk');
const {startSpinner,stopSpinner} = require('../../utils/spinner')
const {prepareSignSend} = require('../Transactions/prepareSignSend')

const setTrustline = async (client,hot,tokenTickerHex, issuerAddress,amount,tokenTicker)=>
{   
    let adjustedTokenAmount = (Number(amount)*10).toString();
    let tx = {
        "TransactionType":'TrustSet',
        "Account":hot.classicAddress,
        "LimitAmount":{
            "currency":tokenTickerHex,
            "issuer":issuerAddress,
            "value":adjustedTokenAmount
        }
    }
    console.log(chalk.yellowBright.bold(`Setting Trustline from `)+
                    chalk.redBright.bold(`${hot.classicAddress} (hot wallet) `)+
                    chalk.yellowBright.bold('to ')+
                    chalk.blueBright.bold(`${issuerAddress} (issuer wallet) `)+
                    chalk.yellowBright.bold(`for ${adjustedTokenAmount} of $${tokenTicker}!`)
    )
    return new Promise(async (resolve,reject)=>{
        try{
            let spinner = startSpinner('Proccessing TrustSet...')
            await prepareSignSend(client,tx,hot)
            stopSpinner(spinner)
            console.log(chalk.greenBright.bold(`Success setting trustline!`))
            resolve(true)
        }
        catch(err){
            reject(console.log(chalk.redBright.bold('There was a problem setting the trust line.')))
            
        }
    })
}

module.exports={setTrustline}