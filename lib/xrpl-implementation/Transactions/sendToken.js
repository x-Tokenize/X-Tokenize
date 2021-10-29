const chalk = require('chalk');
const {startSpinner,stopSpinner} = require('../../utils/spinner')
const {prepareSignSend} = require('../Transactions/prepareSignSend')

const sendToken =async (client,issuer,sender,receiver,tokenTickerHex,amount,tokenTicker)=>
{
    let tx ={
    "TransactionType" : "Payment",
    "Account" : sender.classicAddress,
    "Destination": receiver,
    "Amount" : {
        "currency":tokenTickerHex,
        "value":amount,
        "issuer":issuer.classicAddress
        }
    }
    console.log(chalk.yellowBright.bold(`Sending ${amount} of $${tokenTicker} from `)+
                chalk.blueBright.bold(`${sender.classicAddress} (issuer wallet) to `)+
                    chalk.redBright.bold(`${receiver} (hot wallet) `)        
    )
    return new Promise(async (resolve,reject)=>{

        let spinner = startSpinner('Sending token...')
        try{
            
            await prepareSignSend(client,tx,sender)
            stopSpinner(spinner)
            console.log(chalk.greenBright.bold(`Success Sending Token!`))
            resolve(true)
        }
        catch(err){
            reject(console.log(chalk.redBright.bold('There was a problem sending the token.')))
        }
    })
    
}

module.exports={sendToken}