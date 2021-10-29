const chalk = require('chalk');
const xrpl = require('xrpl');
const {printBanner} = require('../utils/printBanner');
const {startSpinner,stopSpinner} = require('../utils/spinner');

const inquirer = require('../utils/inquirer');

const initialize = async () =>{
    const Testnet = 'wss://s.altnet.rippletest.net:51233';
    const Mainnet = 'wss://xrplcluster.com';
    let client;

    return new Promise(async (resolve,reject)=>{
        
        printBanner();
        const networkType = await inquirer.askNetworkType();

        if(networkType.network ==="Main"){ client = new xrpl.Client(Mainnet);}
        else{client = new xrpl.Client(Testnet);}

        let spinner = startSpinner(`Connecting to the ${networkType.network}: ${networkType.network==="Main"?Mainnet:Testnet}`);
        try{
            await client.connect();
            await stopSpinner(spinner);
            console.log(chalk.greenBright.bold(`Connected to the XRPL ${networkType.network} network.`))
            resolve({network:networkType.network,client:client})
        }
        catch(err)
        {
            await stopSpinner(spinner)
            reject(console.log(chalk.redBright.bold('There was a problem connecting to the network.Please exit and try again')))
        }
    })
}

module.exports={initialize}