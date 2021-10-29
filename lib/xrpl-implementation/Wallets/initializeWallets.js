const chalk = require('chalk');
const {walletCreator} = require('./walletCreator');

const initializeWallets = async ()=>{
    return new Promise(async(resolve,reject)=>{
        try{
            console.log(chalk.blueBright.bold('Let\s create your issuing wallet!'))
            let issuerWallet = await walletCreator();
            console.log(chalk.blueBright.bold('Let\s create your hot wallet!'))
            let hotWallet = await walletCreator();
            resolve({issuer:{wallet:issuerWallet},hot:{wallet:hotWallet}})
        }
        catch(err){reject(err)}
    })
}

module.exports={initializeWallets}