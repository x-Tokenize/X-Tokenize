const chalk = require('chalk')
const inquirer = require('../utils/inquirer')

const {printBanner} = require('../utils/printBanner');
const {initializeWallets} = require('../xrpl-implementation/Wallets/initializeWallets');
const {fundWallets} = require('../xrpl-implementation/Wallets/fundWallets');
const {manageSettings} = require('../xrpl-implementation/AccountSettings/manageSettings');
const {setTrustline} = require('../xrpl-implementation/AccountSettings/setTrustLine')
const {sendToken} = require('../xrpl-implementation/Transactions/sendToken');
const {storeProject} = require('../utils/storeProject');




const createNewProject = async(network,client)=>{
    return new Promise(async(resolve,reject)=>{
        printBanner();
        try{
        let projectName = await inquirer.askProjectName();
        let accounts = await initializeWallets();
        let XRPbalances = await fundWallets(network,client,accounts);
        
        accounts.issuer.xrpBalance=XRPbalances.issuerBalance;
        accounts.hot.xrpBalance=XRPbalances.hotBalance;
        
        let issuerSettings = await inquirer.askAccountIssuerSettings();
        let finalIssuerSettings = await manageSettings(client,accounts.issuer.wallet,issuerSettings.settings);
        accounts.issuer.settings=finalIssuerSettings;

        let hotSettings = await inquirer.askAccountHotSettings();
        let finalHotSettings = await manageSettings(client,accounts.hot.wallet,hotSettings.settings);
        accounts.hot.settings=finalHotSettings;
            
        let tokenTicker = await inquirer.askTokenTicker();
        let tokenAmount = await inquirer.askTokenAmount();

        let tokenTickerHex=(Buffer.from(tokenTicker.symbol,'ascii').toString('hex').toUpperCase()).padEnd(40,'0');

        let trustSetOutcome = await setTrustline(client,
                                                    accounts.hot.wallet,
                                                    tokenTickerHex,
                                                    accounts.issuer.wallet.classicAddress,
                                                    tokenAmount.amount,
                                                    tokenTicker.symbol);
            accounts.hot.trustlineSet = trustSetOutcome;
        
            await sendToken(client,
                            accounts.issuer.wallet,
                            accounts.issuer.wallet,
                            accounts.hot.wallet.classicAddress,
                            tokenTickerHex,
                            tokenAmount.amount.toString(),
                            tokenTicker.symbol)
            
            let myProject = {
                project:projectName.name,
                network:network,
                tokenInfo:
                {
                    token:tokenTicker.symbol,
                    tokenHex:tokenTickerHex,
                    supply:tokenAmount.amount, 
                },
                accounts
            };
            let storeResult = await storeProject(network,myProject);
            resolve(storeResult)
        
        }catch(err)
        {
            reject(err)
        }
    })
}


module.exports={createNewProject}