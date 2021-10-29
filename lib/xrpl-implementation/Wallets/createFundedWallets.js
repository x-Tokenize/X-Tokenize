const chalk=require('chalk');
const {startSpinner,stopSpinner} = require('../../utils/spinner');

const createFundedWallets = async (network,client,amount) =>{
    return new Promise(async(resolve,reject)=>{
        try{
            if(network ==='Test' || 'Dev')
                {
                    console.log(chalk.blueBright.bold('Creating Funded Wallets.'))
                    let spinner = startSpinner('Creating Funded Wallets...')
                    let wallets =[];
                    for(let i=0;i<Number(amount);i++)
                    {
                        let wallet = await client.fundWallet();
                        console.log(wallet)
                        wallets.push(wallet.wallet);
                    }
                   
                    stopSpinner(spinner)
                    console.log(chalk.greenBright.bold(`Accounts funded!`))
                    resolve(wallets)
                }
            else
            {   
                //Implement Flow to display xumm payload to fund      
            }   
        }
        catch(err)
        {
            reject('There was a problem funding your wallets')
        }
    })
}

module.exports={createFundedWallets}