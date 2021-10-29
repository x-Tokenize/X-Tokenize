const chalk = require('chalk')
const {prepareSignSend} = require('../Transactions/prepareSignSend')
const {startSpinner,stopSpinner} = require('../../utils/spinner') 
const setAccountFlag =async (client,account,flag,flagType)=>{
    let tx = {
        "TransactionType":'AccountSet',
        "Account":account.classicAddress,
        "SetFlag":flag
    }
    console.log(chalk.yellowBright.bold(`Setting ${account.address} to ${flagType}...`))
    return new Promise(async (resolve,reject)=>{
        try{
            let spinner = startSpinner(`Setting account flag...`);
            let result = await prepareSignSend(client,tx,account)
            stopSpinner(spinner);
            console.log(chalk.greenBright.bold(`Success setting ${flagType}!`))
            resolve(result)
            
        }
        catch(err){
            stopSpinner(spinner);
            reject(console.log('There was a problem setting your flags..',err))
        }
    })
}

module.exports={setAccountFlag}