const chalk = require('chalk')
const { getProjectDetails } = require('../utils/getProjectDetails')
const inquirer = require('../utils/inquirer')
const {printBanner} = require('../utils/printBanner')
const { sendToken } = require('../xrpl-implementation/Transactions/sendToken')
const xrpl = require('xrpl');
const manageAirdrop = async(network,client,project) =>{
    printBanner();
    let projectDetails = await getProjectDetails(network,project);
    let issuer = projectDetails.accounts.issuer.wallet;
    let hotwallet = xrpl.Wallet.fromSeed(projectDetails.accounts.hot.wallet.seed);
    let tokenTickerHex = projectDetails.tokenInfo.tokenHex;
    let tokenTicker = projectDetails.tokenInfo.token;
    let airdropType = await inquirer.askAirdropType()
    let amount = await inquirer.askAirdropAmountPerTrustline()
   
    let response = await client.request({
        "command":"account_lines",
        "account":issuer.classicAddress,
        "ledger_index":"validated"
    })

    let elligibleLines = [];
    for(let i=0;i<response.result.lines.length;i++)
    {
        if(response.result.lines[i].balance<=0 
            && (response.result.lines[i].account !=hotwallet.classicAddress)
                && (response.result.lines[i].account !=issuer.classicAddress))
        {
            elligibleLines.push(response.result.lines[i].account)
        }
    }
    console.log(elligibleLines)
  
    switch(airdropType.airdropType)
    {
        case 'Airdrop All Trustlines':
            for(let j=0;j<elligibleLines.length;j++)
            {
              await sendToken(client,issuer,hotwallet,elligibleLines[j],tokenTickerHex,amount.amount.toString(),tokenTicker)
            }
            console.log(chalk.greenBright.bold('Airdrop completed!'))
            break;
        case 'Airdrop Random Trustline':
            let randomIndex=Math.floor((Math.random()*elligibleLines.length))
            await sendToken(client,issuer,hotwallet,elligibleLines[randomIndex],tokenTickerHex,amount.amount.toString(),tokenTicker)
            console.log(chalk.greenBright.bold('Airdrop completed!'))
            break;
        
        case 'Home':
            break;
    }

}

module.exports={manageAirdrop}