const conf = new(require('conf'))();
const chalk = require('chalk')
const {getProjectDetails} = require('./getProjectDetails')

const printProjectDetails = async (network,project)=>{
    return new Promise(async(resolve,reject)=>{
        try{
            let projectDetails = await getProjectDetails(network,project);
            console.log(chalk.greenBright.bold(`------------------------------------------------------`))
            console.log(chalk.greenBright.bold(`Project Name: ${projectDetails.project}`))
            console.log(chalk.greenBright.bold(`Network:  ${projectDetails.network}`))
            console.log(chalk.greenBright.bold(`Token Symbol:  ${projectDetails.tokenInfo.token}`))
            console.log(chalk.greenBright.bold(`Token Hex:  ${projectDetails.tokenInfo.tokenHex}`))
            console.log(chalk.greenBright.bold(`Token Supply:  ${projectDetails.tokenInfo.supply}`))
            console.log(chalk.greenBright.bold(`Issuing Address: ${projectDetails.accounts.issuer.wallet.classicAddress}`))
            console.log(chalk.greenBright.bold(`Hot Address: ${projectDetails.accounts.hot.wallet.classicAddress}`))
            console.log(chalk.greenBright.bold(`------------------------------------------------------`))
            resolve()
        }
        catch(err)
        {
            reject(chalk.redBright.bold('There was a problem getting your project details...'))
        }
    })
}

module.exports={printProjectDetails}