const conf = new(require('conf'))();
const chalk = require('chalk')

const storeWallets = async (network,newWallets)=>{
    
    return new Promise(async (resolve,reject)=>{
        try{
            let wallets = network==='Test'?conf.get('Test-Wallets'):conf.get('Main-Wallets');
            if(wallets&&wallets.length>0)
            {
                let allWallets = wallets.concat(newWallets)
                network==='Test'?conf.set('Test-Wallets',allWallets):conf.set('Main-Wallets',allWallets);
                resolve(chalk.greenBright.bold('Success creating Wallets!'))
            }
            else{
                
                wallets =newWallets;
                network==='Test'?conf.set('Test-Wallets',wallets):conf.set('Main-Wallets',wallets);
                resolve(chalk.greenBright.bold('Success creating Wallets!'))  
            }
        }
        catch(err)
        {
            reject(chalk.redBright.bold('There was a problem storing your wallets..'))
        }
    })
}

module.exports={storeWallets}