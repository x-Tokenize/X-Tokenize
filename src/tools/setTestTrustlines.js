import {getTestWallets} from './testWallets.js'
import {getAllTrustlinesToAnIssuer, setTrustline} from '../xrpl/index.js'
import {askForNumberMinMax,createSpinner,printResponse} from '../utils/index.js'
import { configHandler } from '../config/configHandler.js'


const getRandomNumber = (min,max)=>{return Math.floor(Math.random() * (max - min + 1) + min)}

/**
 * @function setTestTrustlines
 * @description
 * Sets trustlines between test wallets and the issuer for a specified number of trustlines. It iterates
 * through the test wallets, checks if a trustline already exists, and if not, sets a new trustline with the issuer. The
 * function stops when the desired number of trustlines is set or all wallets have been checked.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of setting the test trustlines.
 * @throws Will throw an error if there is a problem setting test trustlines.
 */

export const setTestTrustlines = async()=>{
        try{
            
            let testWalletsResponse = await getTestWallets()
            printResponse(testWalletsResponse)
            if(testWalletsResponse.result === 'warn') return {result:'warn',message:'No test wallets found.'}
            else
            {
                let {wallets} = testWalletsResponse
                let howManyTrustlines = await askForNumberMinMax(`How many trustlines do you want to set?(Cancel:0, Max:${wallets.length})`,0,wallets.length)
                if(howManyTrustlines == 0) return {result:'warn',message:'User cancelled trustline creation.'}
                else
                {
                    let currentConfig = await configHandler.getConfigs();
                    let {IC} = currentConfig;
                    let {networkRPC,issuer,currencyHex,totalSupply} = IC

                    let accountLookUpObject = {}
                    let trustlinesResponse = await getAllTrustlinesToAnIssuer(networkRPC,issuer.address)
                    if(trustlinesResponse.lines) trustlinesResponse.lines.forEach((line => accountLookUpObject[line.account] = true))
                    let trustlineOptions = {
                        limitAmount:totalSupply,
                        // qualityIn:getRandomNumber(0,100)>50?getRandomNumber(0,1000000000):0,
                        // qualityOut:getRandomNumber(0,100)>50?getRandomNumber(0,1000000000):0,
                    }
                    let txOptions = {verify:false,verbose:false,txMessage:null,askConfirmation:false}
                    let spinner = await createSpinner(`Trustlines Set: 0/${howManyTrustlines} || Wallets Checked: 0/${wallets.length}`)
                    let trustlineCounter = 0
                    let currentWalletIndex = 0
                  
                    do
                    {
                        //NOTE:When quality in<quality out: results in pathPartial
                        //ex:
                        //"LowQualityIn":  168757178,
                        //"LowQualityOut": 297847504
                        spinner.message(`Trustlines Set: ${trustlineCounter}/${howManyTrustlines} || Wallets Checked: ${currentWalletIndex}/${wallets.length}`)
                        let wallet = wallets[currentWalletIndex]
                        if(accountLookUpObject[wallet.address]) currentWalletIndex++
                        else
                        {
                            let trustline = await setTrustline(networkRPC,issuer.address,currencyHex,wallet,trustlineOptions,txOptions)
                            if(trustline.result === 'success') trustlineCounter++
                            currentWalletIndex++
                        }
                    }
                    while(trustlineCounter < Number(howManyTrustlines) && currentWalletIndex < wallets.length)    

                     spinner.stop()
                    if(trustlineCounter === 0) return {result:'warn',message:'No trustlines were set. All test wallets already had trustlines to the issuer.'}
                    else return {result:'success',message:`Successfully set ${trustlineCounter} trustlines.`}
                }
            }
        }
        catch(err)
        {
            console.log('There was a problem setting test trustlines:',err)
        }
}