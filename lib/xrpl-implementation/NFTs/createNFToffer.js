const createNFToffer = () =>{
    const tx =
    {

    }

    return new Promise((resolve,reject)=>{     
        let spinner = startSpinner('Creating NFT Offer...')
        try{
            
            await prepareSignSend(client,tx,account)
            stopSpinner(spinner)
            console.log(chalk.greenBright.bold(`Creating NFT Offer!`))
            resolve(true)
        }
        catch(err){
            reject(console.log(chalk.redBright.bold('There was a problem Creating NFT Offer')))
        }
    })
}

module.exports ={createNFToffer}