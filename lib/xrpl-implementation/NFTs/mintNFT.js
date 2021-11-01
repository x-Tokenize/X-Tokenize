const chalk = require('chalk');
const {startSpinner,stopSpinner} = require('../../utils/spinner')
const {prepareSignSend} = require('../Transactions/prepareSignSend')

const mintNFT = async (client,account,issuer,transferFee,flags,uri)=>{

    let Tx={
        "TransactionType": "NFTokenMint",
        "Account": account.classicAddress,
        "Issuer": issuer,
        "TransferFee": transferFee,
        "Flags": flags,
        "URI": uri
      }

      console.log(chalk.yellowBright.bold(`Minting NFT on`)+
                chalk.blueBright.bold(`${account.classicAddress} (issuer wallet) `)+
                    chalk.yellowBright.bold(`with a transfer fee of ${transferFee} and the following flags:${flags} `)        
    )

    return new Promise((resolve,reject)=>{     
        let spinner = startSpinner('Minting NFT...')
        try{
            
            await prepareSignSend(client,tx,account)
            stopSpinner(spinner)
            console.log(chalk.greenBright.bold(`Success Minting NFT!`))
            resolve(true)
        }
        catch(err){
            reject(console.log(chalk.redBright.bold('There was a problem minting the NFT.')))
        }
    })

    
}

module.exports ={mintNFT}