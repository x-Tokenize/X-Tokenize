const chalk = require('chalk')
const { getProjectDetails } = require('../utils/getProjectDetails')
const inquirer = require('../utils/inquirer')
const {printBanner} = require('../utils/printBanner')
const { sendToken } = require('../xrpl-implementation/Transactions/sendToken')
const xrpl = require('xrpl');

const sendRequest = async(client,request) =>{
    return new Promise(async(resolve,reject)=>{
        try{
            let response = await client.request(request)
            resolve(response)
        }
        catch(err)
        {
            reject(err)
        }

    })
}

const getAccountLines = async(client,address,marker,lines)=>{
    return new Promise(async(resolve,reject)=>{
        try
        {
            if(marker)
            {
                let nextResponse = await sendRequest(client, {
                                                "command":"account_lines",
                                                "account":address,
                                                "ledger_index":"validated",
                                                "marker":marker
                                            })
                lines.push.apply(lines,nextResponse.result.lines)
                if(nextResponse.result.marker)
                {
                    console.log('in nextresponse marker exists')
                   resolve(await getAccountLines(client,address,nextResponse.result.marker,lines))
                }
                else{
                    console.log('in nextresponse no more markers')
                    //console.log(lines)
                    resolve(lines)
                }
                //resolve(nextResponse)
            }
            else
            {
                let firstResponse = await sendRequest( client,{
                    "command":"account_lines",
                    "account":address,
                    "ledger_index":"validated",
                })
                if(firstResponse.result.marker!=null)
                {
                    console.log('in first response marker exists')
                    resolve(await getAccountLines(client,address,firstResponse.result.marker,firstResponse.result.lines))
                }
                else{
                    console.log('in first response marker doesnt exist')

                   resolve(firstResponse.result.lines)
                }
            }
             
            
            // console.log(response)
            // let lines = response.result.lines;
            // let marker = response.result.marker
            // do{
            //     if(marker!=null)
            //     {
            //         console.log('marker not null')
            //         
            //         lines.push.apply(lines,response.result.lines);
            //         marker=response.result.marker;
            //     }
            // }while(marker!=null)
            // resolve(lines)
        }
        catch(err)
        {
            reject('There was a problem getting account lines ')
        }
    })
}

let getElligibleLines = (lines,hotAddress,issuerAddress) =>{
    let elligibleLines =[];
    console.log(lines[0])
    for(let i=0;i<lines.length;i++)
    {
        if(lines[i].balance<=0 
            && (lines[i].account !=hotAddress)
                && (lines[i].account !=issuerAddress))
            {
                elligibleLines.push(lines[i].account)
            }
    }
   
        return(elligibleLines)
    
}

const manageAirdrop = async(network,client,project) =>{
    printBanner();
    let projectDetails = await getProjectDetails(network,project);
    let issuer = projectDetails.accounts.issuer.wallet;
    let hotwallet = xrpl.Wallet.fromSeed(projectDetails.accounts.hot.wallet.seed);
    let tokenTickerHex = projectDetails.tokenInfo.tokenHex;
    let tokenTicker = projectDetails.tokenInfo.token;
    let lines = await getAccountLines(client,issuer.classicAddress)
    console.log('Amount of trustlines:',lines.length)
    //console.log(lines[0],hotwallet.classicAddress,issuer.classicAddress)
    let elligibleLines =  getElligibleLines(lines,hotwallet.classicAddress,issuer.classicAddress)
   // console.log(elligibleLines[5])
    //console.log(response)
    let airdropType = await inquirer.askAirdropType()
    let amount = await inquirer.askAirdropAmountPerTrustline()
    
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
            // let randomIndex=Math.floor((Math.random()*elligibleLines.length))
            // await sendToken(client,issuer,hotwallet,elligibleLines[randomIndex],tokenTickerHex,amount.amount.toString(),tokenTicker)
            // console.log(chalk.greenBright.bold('Airdrop completed!'))
            break;
        
        case 'Home':
            break;
    }

}

module.exports={manageAirdrop}