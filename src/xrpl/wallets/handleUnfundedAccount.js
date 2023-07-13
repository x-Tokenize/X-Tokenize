import {getFundedTestnetWallet} from './getFundedTestnetWallet.js'
import {infoMessage,successMessage,askYesNo, errorMessage, wait, pressAnyKey, warningMessage, printResponse, askForTextInput, printBanner, createSpinner, askForNumberMinMax} from '../../utils/index.js'
import { transactionHandler } from '../core/transactionHandler.js'
import xrpl from 'xrpl'
import { printQR } from '../../utils/output/printQR.js'
import { getAccountInfo } from '../data/getAccountInfo.js'
import { configHandler } from '../../config/configHandler.js'
import { getXrpBalance } from '../data/getXrpBalance.js'

import { sendXRP } from '../transactions/sendXRP.js'

 /**
 * @function fundWithFundingAccount
 * @description
 * This function attempts to fund an XRPL account using a configured funding account. It first checks if a
 * funding account is configured and active on the network. If so, it prompts the user to confirm using the funding
 * account and specifies the amount of XRP to send. The function then sends the XRP to the target account and returns
 * the result of the transaction.
 * 
 * @param {string} network - The network the user is working with (e.g., 'testnet', 'mainnet').
 * @param {string} networkRPC - The RPC URL of the network.
 * @param {string} address - The XRPL address of the account to be funded.
 * @returns {Promise<Object>} - An object containing the result ('success', 'warn', or 'error') and a message describing
 * the outcome.
 * @throws {Error} - If there is an issue with the funding process.
 */
export const fundWithFundingAccount = async(network,networkRPC,address)=>{
    try
    {
        let currentConfig = configHandler.getConfigs();
        if(currentConfig.XTOKENIZE_SETTINGS.funding_account!== null)
        {
            let fundingAccount = currentConfig.XTOKENIZE_SETTINGS.funding_account
            if(address===fundingAccount.address) return {result:'warn', message:'The funding account is the same as the account you are trying to fund.'}
            else 
            {
                let fundingAccountInfo = await getAccountInfo(networkRPC,fundingAccount.address)
                if(fundingAccountInfo.result ==='success')
                {
                    console.log()
                    infoMessage(`It appears you are configured to use ${fundingAccount.address} to fund accounts.`)
                    if(address!==fundingAccount.address && await askYesNo(`Would you like to use this account?`,true))
                    {
                        let xrpBalancesResponse = await getXrpBalance(networkRPC,fundingAccount.address,false);
                        if(xrpBalancesResponse.result ==='success')
                        {

                            let {spendable} = xrpBalancesResponse
                            if(spendable > 0)
                            {
                                let fundingAmount = await askForNumberMinMax(`How much XRP would you like to send to ${address}? (0:cancel)(Max:${spendable})`,0,spendable)
                                if(fundingAmount ==='0') return {result:'warn', message:`User cancelled funding the account.`}
                                else
                                {
                                    let txOptions = {verify:true,verbose:true,txMessage:`Funding ${address} with ${fundingAmount} $XRP.`,askConfirmation:true}
                                    return await sendXRP(networkRPC,fundingAccount,address,xrpl.xrpToDrops(fundingAmount),txOptions)
                                }
                            }
                            else return {result:'warn', message:`${fundingAccount.address} does not have a spendable balance on the ${network} network.`}
                        }
                        else return {result:`warn`,message:`There was a problem getting the spendable balance of ${fundingAccount.address}.`}
                    }
                    else return {result:'warn', message:`User does not want to use ${fundingAccount.address} to fund the account.`}
                }
                else return {result:'warn',message:`${fundingAccount.address} is not active on the ${network} network.`}
            }
        }
        else return {result:'warn',message:'There is no funding account configured.'}
    }
    catch(err)
    {
        console.log(`There was a problem checking the funding account on the network.`)
        console.log(err)
    }
}

/**
 * @function handleUnfundedAccount
 * @description
 * This function handles the process of funding an unfunded XRPL account. It first prompts the user to
 * confirm if they want to fund the account. If the user agrees, the function attempts to fund the account using the
 * configured funding account. If that fails or the user declines, it offers alternative funding methods based on the
 * network being used (testnet, mainnet, or altnet). The function returns the result of the funding process.
 * 
 * @param {string} network - The network the user is working with (e.g., 'testnet', 'mainnet').
 * @param {string} networkRPC - The RPC URL of the network.
 * @param {string} address - The XRPL address of the account to be funded.
 * @returns {Promise<Object>} - An object containing the result ('success', 'warn', or 'error') and a message describing
 * the outcome.
 * @throws {Error} - If there is an issue with the funding process.
 */
export const handleUnfundedAccount = async (network,networkRPC,address) => {
        try
        { 
            if(await askYesNo('Would you like to fund the account?',true))
            { 
                let fundingAccountResult = await fundWithFundingAccount(network,networkRPC,address);
                if(fundingAccountResult.result ==='success') return {result:'success',message:'Successfully funded the account.'}
                else 
                {
                    printResponse(fundingAccountResult)
                    if (await askYesNo(`Would you like to use the default alternative funding method determined by the network you are working with?`,true))
                    {
                        if(network ==='testnet')
                        {
                            console.log()
                            infoMessage('It appears you are configured for the testnet. We can fund the account for you.')
                            let fundedWalletResult = await getFundedTestnetWallet(true)
                            if(fundedWalletResult.result ==='success')
                            {
                                await wait(4000)
                                let fundedWallet = fundedWalletResult.account
                                let tx = {"TransactionType":"Payment","Account":fundedWallet.address,"Amount":"980000000","Destination":address}
                                let txOptions = {verify:true,verbose:true,txMessage:`Funding ${address} with 980 $XRP.`,askConfirmation:false}
                                let txResult = await transactionHandler(networkRPC,tx,fundedWallet,txOptions)
                                if(txResult.result ==='success') return {result:'success',message:'Successfully funded the account.'}
                                else {
                                    printResponse(txResult)
                                    return {result:'warn',message:'Failed to fund the account.'}
                                }
                            } 
                            else
                            {
                                printResponse(fundedWalletResult)
                                return {result:'warn',message:'Failed to fund the account.'}
                            }
                        }  
                        else if (network === 'mainnet')
                        {
                            
                            let result = await handleMainnetAccount(networkRPC,address)
                            return result
                        }
                        else
                        {
                            infoMessage(`It appears we are on an altnet. You need to provide the seed of a funded faucet account.`)
                            let seed = await askForTextInput('Please enter the seed of a funded faucet account.(0:Cancel)')
                            if(seed === '0') return {result:'warn',message:'User cancelled.'}
                            else
                            {
                                if(!xrpl.isValidSecret(seed)) return {warn:'warn',message:'Invalid seed.'}
                                else
                                {
                                    let fundedWallet = xrpl.Wallet.fromSeed(seed)
                                    let tx = {"TransactionType":"Payment","Account":fundedWallet.address,"Amount":"980000000","Destination":address}
                                    let txOptions = {verify:true,verbose:true,txMessage:`Funding ${address} with 980 $XRP.`,askConfirmation:false}
                                    let txResult = await transactionHandler(networkRPC,tx,fundedWallet,txOptions)
                                    if(txResult.result ==='success') return {result:'success',message:'Successfully funded the account.'}
                                    else {
                                        printResponse(txResult)
                                        return {result:'warn',message:'Failed to fund the account.'}
                                    }
                                }
                            }
                        }
                    }
                    else return {result:'warn',message:'User declined to fund the account using the default funding methods.'}
                }
            }
            else
            {
                return {result:'warn',message:'User declined to fund the account.'}
            }
        }
        catch(err)
        {
            console.log('there was problem handling the unfunded account....')
            console.log('err: ',err)
        }
}

/**
 * @function handleMainnetAccount
 * @description
 * This function handles the process of funding an XRPL account on the mainnet. It displays a QR code and
 * the account address for the user to send funds to. The function then waits for the account to be funded, periodically
 * checking the account status. If the account is not funded within the specified time limit, the function returns a
 * warning message.
 * 
 * @param {string} networkRPC - The RPC URL of the mainnet.
 * @param {string} address - The XRPL address of the account to be funded.
 * @returns {Promise<Object>} - An object containing the result ('success', 'warn', or 'error') and a message describing
 * the outcome.
 * @throws {Error} - If there is an issue with the funding process.
 */
export const handleMainnetAccount = async(networkRPC,address)=>{
        try
        {
            printBanner()
            console.log()
            infoMessage('It appears you are configured for the mainnet and will be using real funds.')
            infoMessage(`You can fund the account by scanning the QR code with your mobile wallet or by sending funds to your address below it.`)
            await printQR(address);
            infoMessage(`ADDRESS: ${address}`)
            infoMessage(`If you haven't funded the account in 5 minutes. It will be assumed that you have decided not to fund the account.`)

            let attempts =0;
            let spinner = await createSpinner(`STATUS:Waiting for account funding... ${attempts}/30`)
            let result 
            for(let i = 0 ; i < 30 ; i++)
            {
                let accountInfo = await getAccountInfo(networkRPC,address)
                if(accountInfo.result === 'success') 
                {
                    spinner.stop()
                    printBanner()
                    successMessage(`The account has been funded with ${xrpl.dropsToXrp(accountInfo.account_data.Balance)} $XRP.`)
                    result = {result:'success',message:'The account is now funded.'}
                    break;
                }
                else
                {
                    if(attempts === 29)
                    {
                        spinner.stop()
                        printBanner()
                        warningMessage(`The account was not funded in time.`)
                        result = {result:'warn',message:'The account was not funded in time.'}
                    }
                    else 
                    {
                        attempts++
                        spinner.message(`STATUS: Waiting for account funding... ${attempts}/30`)
                    }
                }
                await wait(5000)
            }
            spinner.stop()
            await pressAnyKey('Press any key to continue.')
            return result

           
        }
        catch(err)
        {
            console.log(`There was a problem handling the mainnet account.`)
        }
}