const chalk=require('chalk');
const {startSpinner,stopSpinner} = require('../../utils/spinner');

const fundWallets = async (network,client,accounts) =>{
    return new Promise(async(resolve,reject)=>{
        try{
            if(network ==='Test' || 'Dev')
                {
                    console.log(chalk.blueBright.bold('It seems we are on the test network. Let\s fund your wallets...'))
                    let spinner = startSpinner('Funding Accounts...')

                    let fundedIssuer = await client.fundWallet(accounts.issuer.wallet);
                    let fundedHot = await client.fundWallet(accounts.hot.wallet);
                    stopSpinner(spinner)
                    console.log(chalk.greenBright.bold(`Accounts funded!`))
                    resolve({issuerBalance:fundedIssuer.balance,hotBalance:fundedHot.balance})
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

module.exports={fundWallets}