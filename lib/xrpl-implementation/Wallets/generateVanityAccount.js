const {generateAccount} = require('./generateAccount');
const {printBanner} = require('../../utils/printBanner')
const chalk = require('chalk')

const generateVanityAccount = (phrase)=>{
    let phraseLength = phrase.length
    for(let i=0;i<1000000000;i++)
    {
         if(i%1000===0)
         {
            printBanner();
            console.log(
            chalk.greenBright.bold('Creating Vanity wallet with phrase: ')+
            chalk.yellowBright.bold(phrase)
            )
            console.log(chalk.redBright.bold('Vanity addresses may take a while and there\'s no guarentee one will be found'))
            console.log(`Attempt ${i} out of 1,000,000,000`)
         }
         let account = generateAccount();
         let checkThisPart = account.classicAddress.slice(1,phraseLength+1).toLowerCase();
         if(phrase===checkThisPart){return account}
          
    }
}

module.exports={generateVanityAccount};