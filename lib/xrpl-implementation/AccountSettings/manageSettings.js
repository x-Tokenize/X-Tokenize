const xrpl = require('xrpl');
const {setAccountFlag} = require('./setAccountFlag');
const {prepareSignSend} = require('../Transactions/prepareSignSend');
const chalk = require('chalk')

const manageSettings = async (client,account, settings) =>{
    return new Promise(async (resolve,reject)=>{
        let finalSettings=
        {
            defaultRippling:false,
            authorizedTrustlines:false,
            requireDestinationTags:false,
            disallowXRP:false,
            tickSize:5,
            transferRate:0,
            domain:''
        }
        try{
            for(let i=0; i <settings.length;i++)
            {
                let setting = settings[i];
            
                if(setting=='Default Ripple'){
                    await setAccountFlag(client,account,xrpl.AccountSetAsfFlags.asfDefaultRipple, 'default ripple')
                    finalSettings.defaultRippling=true;
                }
                else if(setting=='Authorized Trust Lines only'){
                    await setAccountFlag(client,account,xrpl.AccountSetAsfFlags.asfRequireAuth, 'authorized trust lines only')
                    finalSettings.authorizedTrustlines=true;

                }
                else if(setting=='Require Destination Tags'){
                    await setAccountFlag(client,account,xrpl.AccountSetAsfFlags.asfRequireDest,'require destination tags')
                    finalSettings.requireDestinationTags=true;
                }
                else if(setting=='Disallow XRP'){
                    await setAccountFlag(client,account,xrpl.AccountSetAsfFlags.asfDisallowXRP,'disallow incoming xrp')
                    finalSettings.disallowXRP=true;
                }
                else if(setting=='Change Tick Size (default 5)')
                {
                    let tickSize = await inquirer.askTickSize();
                    let spinner = startSpinner(`Adjusting account ticksize...`);
                    let tx = {
                        "TransactionType":'AccountSet',
                        "Account":account.classicAddress,
                        "TickSize":Number(tickSize.tickSize)
                    }
                    await prepareSignSend(client,tx,account)
                    finalSettings.tickSize=tickSize.tickSize;
                    stopSpinner(spinner);

                }
                else if(setting=='Set Transfer Fee')
                {
                    let transferRate = await inquirer.askTransferFee()
                    let spinner = startSpinner(`Adjusting account transfer rate...`);
                    let tx = {
                        "TransactionType":'AccountSet',
                        "Account":account.classicAddress,
                        "TransferRate":Number(transferRate.transferFee)
                    }
                    await prepareSignSend(client,tx,account)
                    finalSettings.transferRate=transferRate.transferFee;
                    stopSpinner(spinner);
                }
                else if(setting=='Add Domain Name')
                {
                    let domain = await inquirer.askDomain()
                    let spinner = startSpinner(`Adjusting account Domain...`);
                    let tx = {
                        "TransactionType":'AccountSet',
                        "Account":account.classicAddress,
                        "Domain":domain.domain
                    }
                    await prepareSignSend(client,tx,account)
                    finalSettings.domain=domain.domain;
                    stopSpinner(spinner);
                }    
            }  
            console.log(chalk.greenBright.bold('Success with all settings!'));
            resolve(finalSettings);
        }
        catch(err)
        {
            reject(console.log(chalk.redBright.bold('There was an issue with a setting.')))
        }
    })
}

module.exports={manageSettings}