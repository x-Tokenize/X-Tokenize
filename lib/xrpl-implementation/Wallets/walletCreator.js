const {generateAccount} = require('./generateAccount')
const {generateVanityAccount} = require('./generateVanityAccount')
const inquirer = require('../../utils/inquirer')
const {startSpinner,stopSpinner} = require('../../utils/spinner')
const chalk = require('chalk')

let walletCreator = async ()=>{
    const WalletCreationMethod = await inquirer.WalletCreation();
    let creationMethod = WalletCreationMethod.walletType.split(' ');
    
    if(creationMethod[0]==='Random')
        {
            let status = startSpinner(`Creating ${creationMethod[0]} wallet.`)
            let account =await generateAccount();
            console.log(chalk.greenBright.bold(`Here are your account details:`))
            console.log(chalk.greenBright.bold(JSON.stringify(account,null,4)))
            stopSpinner(status)
            return account;
        }

    else if(creationMethod[0]==='Vanity')
        {
            const vanityPhrase = await inquirer.VanityPhrase();
            //let lowercasePhrase=vanityPhrase.phrase.toLowerCase();
            let lowercasePhrase = vanityPhrase.phrase
            let status = startSpinner(`Creating ${creationMethod[0]} wallet.`)
            //setTimeout(async ()=>{
                let account = await generateVanityAccount(lowercasePhrase,status)
                console.log(chalk.greenBright.bold(`Here are your account details:`))
                console.log(chalk.greenBright.bold(JSON.stringify(account,null,4)))
                stopSpinner(status)
                return account;
            //},500)
        }
    else
    { 
            const seedPhrase = await inquirer.SeedPhrase();
            let status = startSpinner(`Creating ${creationMethod[0]} wallet.`)
            let account =await generateAccount(seedPhrase.seed);
            console.log(chalk.greenBright.bold(`Here are your account details:`))
            console.log(chalk.greenBright.bold(JSON.stringify(account,null,4)))
            stopSpinner(status)
            return account;
    }
}

module.exports={walletCreator}