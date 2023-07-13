import xrpl from 'xrpl'
import { createSpinner,askForNumberMinMax, pressAnyKey, printResponse, askYesNo ,wait} from '../utils/index.js'
import { getFundedTestnetWallet } from '../xrpl/wallets/getFundedTestnetWallet.js'
import { configHandler } from '../config/configHandler.js'
import { getXrpBalance ,sendXRP} from '../xrpl/index.js'

 /**
 * @function fundTestWallets
 * @description
 * This function funds test wallets with a specified amount of XRP. It prompts the user to enter the
 * desired spendable balance for each account, 
 * retrieves a funded testnet wallet, and sends the necessary amount of XRP to top off the test wallets. It handles
 * errors and waits before retrying 
 * failed operations. It also provides a progress spinner to display the number of accounts handled and funded.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of funding the test wallets.
 * @throws {Error} - Throws an error if there is a problem funding test wallets.
 */
export const fundTestWallets = async()=>{
        try{
            let networkRPC = "https://s.altnet.rippletest.net:51234"
            let {wallets} = await configHandler.getConfigs('TEST_WALLETS');
            if(wallets.length == 0) return {result:'warn',message:'No test wallets found.'}
            else
            {
                let xrpEach = await askForNumberMinMax('What should be the spendable balance of each account?(Cancel:0, Max:100)',0,100)
                if(xrpEach === '0') return {result:'warn',message:'User cancelled test wallet funding.'}
                else
                {
                    let drops = Number(xrpEach*1000000)
                    let fundedWalletSpendableBalance=0;
                    let accountsHandled=0;
                    let accountsFunded=0;
                    let fundedWalletResponse
                    let fundedWallet
                    let txOptions = {verify:false,verbose:false,txMessage:null,askConfirmation:false}
                    let spinner = await createSpinner(`Accounts handled: ${accountsHandled}/${wallets.length} | `)
                   do{
                        if(fundedWalletSpendableBalance ===0 || fundedWalletSpendableBalance < drops)
                        {
                           
                            spinner.message(`Accounts handled: ${accountsHandled}/${wallets.length} | Getting a funded testnet Wallet..`)
                            fundedWalletResponse = await getFundedTestnetWallet(false)
                            if(fundedWalletResponse.result==='success')
                            {
                                spinner.message(`Accounts handled: ${accountsHandled}/${wallets.length} | Getting the spendable balance of the funding wallet...`)
                                let {spendable} = await getXrpBalance(networkRPC,fundedWalletResponse.account.address,true)
                                fundedWalletSpendableBalance = spendable
                                fundedWallet=fundedWalletResponse.account
                            }
                            else
                            {
                                spinner.message(`Failed to get a funded testnet wallet. Waiting 5 seconds before trying again.`)
                                await wait(5000)
                                fundedWalletSpendableBalance=0;
                            }
                        }
                        else
                        {
                            let wallet = wallets[accountsHandled]
                            spinner.message(`Accounts handled: ${accountsHandled}/${wallets.length} | Getting the spendable balance of the test wallet...`)
                            let xrpBalanceResult= await getXrpBalance(networkRPC,wallet.address,true)
                            printResponse(xrpBalanceResult)
                            if(xrpBalanceResult.result==='success')
                            {
                                let {spendable} = xrpBalanceResult
                                if(spendable >= drops) accountsHandled++
                                else
                                {
                                    let amountToFund =(Number(drops)-Number(spendable)).toString()
                                    if(amountToFund > fundedWalletSpendableBalance) fundedWalletSpendableBalance=0
                                    else
                                    {
                                        spinner.message(`Accounts handled: ${accountsHandled}/${wallets.length} | Sending ${xrpl.dropsToXrp(amountToFund)} $XRP to top off the test wallet...`)
                                        let sendXRPResult = await sendXRP(networkRPC,fundedWallet,wallet.address,amountToFund,txOptions)
                                        if(sendXRPResult.result==='success')
                                        {
                                            fundedWalletSpendableBalance-=amountToFund
                                            accountsHandled++
                                            accountsFunded++
                                            if(accountsFunded!=0 && accountsFunded%100===0)
                                            {
                                                spinner.message(`Accounts handled: ${accountsHandled}/${wallets.length} | Waiting 60 seconds before continuing........................................`)
                                                await wait(60000)
                                            }
                                        } 
                                    }
                                }
                            }
                            else
                            {
                                spinner.message(`Failed to get the xrp balance of the test wallet. Waiting 5 seconds before trying again.`)
                                await wait(5000)
                            }
                        }
                        spinner.message(`Accounts handled: ${accountsHandled}/${wallets.length} |                                                                                       `)
                   }
                   while(accountsHandled !== wallets.length)
                    spinner.stop()
                    return {result:'success',message:`Successfully funded ${accountsHandled} test wallets.`}
                }
            }
        }
        catch(err)
        {
            console.log('There was a problem funding test wallets:',err)
        }
}

/**
 * @function getTestWallets
 * @description
 * This function retrieves the test wallets from the configuration. It checks if there are any test
 * wallets available and returns the result 
 * along with the number of test wallets found.
 * 
 * @returns {Promise<Object>} - An object containing the result ('success' or 'warn'), a message describing the outcome of the
 * operation, and an array of test wallets.
 * @throws {Error} - Throws an error if there is a problem getting test wallets.
 */
export const getTestWallets = async()=>{
        try{
            let {wallets} = await configHandler.getConfigs('TEST_WALLETS')
            if(wallets.length == 0) return {result:'warn',message:'No test wallets found.'}
            else return {result:'success',message:`Found ${wallets.length} test wallets.`,wallets:wallets}
        }
        catch(err)
        {
            console.log('There was a problem getting test wallets:',err)
        }
}

/**
 * @function createTestWallets
 * @description
 * This function creates a specified number of test wallets and stores them in the configuration. It
 * prompts the user to enter the desired number of test 
 * wallets to create, generates the wallets, and updates the test wallets configuration. It provides a progress
 * spinner to display the number of wallets created.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the test wallet creation outcome.
 * @throws {Error} - Throws an error if there is a problem creating test wallets.
 */
export const createTestWallets = async()=>{
        try{
            let testWalletsResponse = await getTestWallets()
            printResponse(testWalletsResponse)
            let existingNumberWallets= testWalletsResponse.wallets?testWalletsResponse.wallets.length:0
            const numberOfWallets = await askForNumberMinMax('How many test wallets do you want to create?(Cancel:0, Max:10000)',0,10000)
            if(numberOfWallets == 0) return {result:'warn',message:'User cancelled test wallet creation.'}
            else{
               let wallets = []
               let spinner = await createSpinner(`Creating wallets... 0/${numberOfWallets}} created`)
                for(let i = 0; i < numberOfWallets; i++)
                {
                    let wallet = xrpl.Wallet.generate()
                    let formattedWallet = {address:wallet.classicAddress,seed:wallet.seed}
                    wallets.push(formattedWallet)
                    spinner.message(`Creating wallets... ${i+1}/${numberOfWallets} created`)
                } 
                spinner.stop()
                await configHandler.updateTestWallets(wallets)
                let newTestWalletsLength = await getTestWallets()
                let expectedNewLength = Number(numberOfWallets)+existingNumberWallets
                if(newTestWalletsLength.wallets.length === expectedNewLength) return {result:'success',message:`Created ${numberOfWallets} test wallets for a total of ${expectedNewLength}.`}
                else return {result:'warn',message:`Failed to store test wallets. Expected ${expectedNewLength} wallets, but found ${newTestWalletsLength.wallets.length} wallets.`}
            }
        }
        catch(err)
        {
            console.log('There was a problem creating test wallets:',err)
        }
}

