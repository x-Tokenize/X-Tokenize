const cancelNFToffer = () =>{
    const tx =
    {

    }

    return new Promise((resolve,reject)=>{     
        let spinner = startSpinner('Cancelling NFT Offer...')
        try{
            
            await prepareSignSend(client,tx,account)
            stopSpinner(spinner)
            console.log(chalk.greenBright.bold(`Cancelling NFT Offer!`))
            resolve(true)
        }
        catch(err){
            reject(console.log(chalk.redBright.bold('There was a problem cancelling NFT Offer')))
        }
    })

}

module.exports ={cancelNFToffer}