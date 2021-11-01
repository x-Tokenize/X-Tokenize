const chalk = require('chalk')
const inquirer = require('../utils/inquirer')
const conf =new (require('conf'))()
const {printBanner} = require('../utils/printBanner');
const { storeWallets } = require('../utils/storeWallets');
const { createFundedWallets } = require('../xrpl-implementation/Wallets/createFundedWallets');
const {getProjectDetails} = require('../utils/getProjectDetails')
const {setTrustline} = require('../xrpl-implementation/AccountSettings/setTrustLine')
const xrpl = require('xrpl');
const { walletCreator } = require('../xrpl-implementation/Wallets/walletCreator');

const tools = async (network,client,projects)=>{
    printBanner();
    return new Promise(async (resolve,reject)=>{
        try{
            let tool = await inquirer.askToolType()
            switch(tool.toolType)
            {
                case 'Create Funded Wallets':
                    let NumberOfWallets = await inquirer.askNumberOfWallets();
                    let wallets = await createFundedWallets(network,client,NumberOfWallets.amount)
                    let storeResult = await storeWallets(network,wallets)
                    resolve(storeResult)
                    break;
                case 'View Funded Wallets':
                    let fundedWallets = (network==='Test')?conf.get('Test-Wallets'):conf.get('Main-Wallets');
                    console.log(chalk.greenBright.bold(`${network} network wallets:`))
                    console.log(chalk.greenBright.bold(JSON.stringify(fundedWallets,null,4)))
                    await inquirer.pressEnterToReturn();
                    resolve();
                    break;
                case 'Create General Wallet':
                    let wallet = await walletCreator();
                    console.log(chalk.greenBright.bold(`${network} network wallets:`))
                    console.log(chalk.greenBright.bold(JSON.stringify(wallet,null,4)))
                    await inquirer.pressEnterToReturn();
                    resolve(storeResult2);
                    break;
                case 'Set TrustLines To An Existing Project':
                    let project = await inquirer.selectAProject(projects);
                    let fundedWs = network==='Test'?conf.get('Test-Wallets'):conf.get('Main-Wallets');
                    let projectDetails = await getProjectDetails(network,project.project)
                    let tokenTickerHex = projectDetails.tokenInfo.tokenHex;
                    let issuerAddress = projectDetails.accounts.issuer.wallet.classicAddress;
                    let amount = projectDetails.tokenInfo.supply;
                    let tokenTicker =  projectDetails.tokenInfo.token;
                    for(let i=0;i<fundedWs.length;i++)
                    {
                        let w = xrpl.Wallet.fromSeed(fundedWs[i].seed)
                       await setTrustline(client,w,tokenTickerHex,issuerAddress,amount,tokenTicker,true) 
                    }
                    await inquirer.pressEnterToReturn();
                    resolve();
                    break;
                
                case 'Home':
                    resolve()
                    break;
            }
        }
        catch(err)
        {
            reject('There was a problem with the tool.',err)
        }
    })
}

module.exports={tools}