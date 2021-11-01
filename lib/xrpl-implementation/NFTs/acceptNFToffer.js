const acceptNFToffer = () =>{
    const tx =
    {

    }

    return new Promise((resolve,reject)=>{     
        let spinner = startSpinner('Accepting NFT Offer...')
        try{
            
            await prepareSignSend(client,tx,account)
            stopSpinner(spinner)
            console.log(chalk.greenBright.bold(`Accepting NFT Offer!`))
            resolve(true)
        }
        catch(err){
            reject(console.log(chalk.redBright.bold('There was a problem Accepting NFT Offer')))
        }
    })
}

module.exports ={acceptNFToffer}