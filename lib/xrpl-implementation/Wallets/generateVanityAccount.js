const {generateAccount} = require('./generateAccount');
const {printBanner} = require('../../utils/printBanner')
const chalk = require('chalk')

const generateVanityAccount = (phrase)=>{
    let phraseLength = phrase.length
    for(let i=0;i<100000;i++)
    {
         if(i%500===0)
         {
            printBanner();
            console.log(
            chalk.greenBright.bold('Creating Vanity wallet with phrase: ')+
            chalk.yellowBright.bold(phrase)
            )
            console.log(chalk.redBright.bold('Vanity addresses may take a while and there\'s no guarentee one will be found'))
            console.log(`Attempt ${i} out of 1,000,000`)
         }
         let account = generateAccount();
         let checkThisPart = account.wallet.classicAddress.slice(1,phraseLength+1).toLowerCase();
         if(phrase===checkThisPart){return account}
          
    }
}

module.exports={generateVanityAccount};