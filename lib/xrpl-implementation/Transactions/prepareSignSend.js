const chalk = require('chalk')
const prepareSignSend = async (client,tx,account,unreliable) =>{
    return new Promise(async (resolve,reject)=>{
        try{
            let autofilledTX = await client.prepareTransaction(tx);
            let signed = await account.sign(autofilledTX)
            if(unreliable){await client.submit(signed.tx_blob)}
            else{await client.submitAndWait(signed.tx_blob)}
            resolve(true)
        }
        catch(err){
            reject(console.log(chalk.redBright.bold(`There was a problem sending the TX: ${err}`)))
        }
    })
}

module.exports={prepareSignSend}