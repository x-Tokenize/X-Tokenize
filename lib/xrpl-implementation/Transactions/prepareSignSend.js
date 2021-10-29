const chalk = require('chalk')
const prepareSignSend = async (client,tx,account) =>{
    return new Promise(async (resolve,reject)=>{
        try{
            let autofilledTX = await client.prepareTransaction(tx);
            let signed = await account.sign(autofilledTX)
            let submitted = await client.submitAndWait(signed.tx_blob)
            resolve(true)
        }
        catch(err){
            reject(console.log(chalk.redBright.bold(`There was a problem sending the TX: ${err}`)))
        }
    })
}

module.exports={prepareSignSend}