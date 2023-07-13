import {configHandler} from '../config/configHandler.js'
import {askForNumberMinMax, infoMessage,pressAnyKey,printResponse,importantMessage,warningMessage,askYesNo, wait} from '../utils/index.js'
import { getAllTrustlinesToAnIssuer, transactionHandler} from '../xrpl/index.js'
import {getTestWallets} from './testWallets.js'



/**
 * @function sendOnDemandPaymentsToDistribution
 * @description
 * This function is responsible for sending on-demand payments to a distribution. It first checks if there
 * is a distribution loaded and prompts the user to load a different distribution if desired. Then, it filters the NFTs
 * available for purchase and retrieves test wallets. If the currency type is Issued Currency (IC), it filters the
 * wallets based on trustlines to the issuer. The function then prompts the user to input the number of NFTs they want
 * to purchase and sends the payments accordingly.
 * 
 * @param {boolean} loaded - Indicates whether a distribution is loaded or not.
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the operation.
 * @throws {Error} - Throws an error if there is a problem purchasing simple distribution NFTs.
 */
export const sendOnDemandPaymentsToDistribution=async(loaded)=>{
        try
        {
            let currentConfig = await configHandler.getConfigs()
            if(typeof currentConfig.NFT_DISTRIBUTION.name === typeof undefined)
            {
                infoMessage(`It looks like there isn't a distribution loaded.`)
                await configHandler.selectConfig('NFT_DISTRIBUTION')
                return await sendOnDemandPaymentsToDistribution(true)
            }
            else if(!loaded)
            {
                infoMessage(`Distribution currently loaded with name: ${currentConfig.NFT_DISTRIBUTION.name}`)
                importantMessage(`If you are currently executing a distribution you shouldn't load a new one.`)
                if(await askYesNo(`Would you like to load a different distribution?`,false))
                {
                    await configHandler.selectConfig('NFT_DISTRIBUTION')
                }
                else warningMessage(`Continuing with current distribution.`)
                return await sendOnDemandPaymentsToDistribution(true)
            }
            else
            {
                currentConfig = await configHandler.getConfigs()
                let {NFT,NFT_DISTRIBUTION} = currentConfig
                let {networkRPC,minter,authorizedMinting,authorizedMinter} = NFT
                let {nfts,currency,distributionType,paymentAccount} = NFT_DISTRIBUTION
                let paymentAccountAddress = paymentAccount!==null?paymentAccount.address:null;
                paymentAccountAddress===null?paymentAccountAddress = authorizedMinting?authorizedMinter.address:minter.address:null


                let nftsAvailable = nfts.filter((nft)=>nft.status === 'pending')
                if(nftsAvailable.length === 0)  return {result:'warn',message:'There are no nfts available to purchase.'}
                else
                {
                    let testWalletsResponse = await getTestWallets()
                    printResponse(testWalletsResponse)
                    if(testWalletsResponse.result === 'warn') return {result:'warn',message:'No test wallets found.'}
                    else
                    {
                        let {wallets} = testWalletsResponse
                        let {type,code,hex,issuer,amount} = currency
                        let usableWallets = []
                        if(type !=='IC')
                        {
                            usableWallets = wallets
                            //TODO: CHECK SPENDABLE BALANCE OF EACH WALLET
                        } 
                        else
                        {
                            let issuerTrustlinesResponse = await getAllTrustlinesToAnIssuer(networkRPC,issuer);
                            printResponse(issuerTrustlinesResponse)
                            if(issuerTrustlinesResponse.result !== 'success') return {result:'failed',message:'There was a problem getting trustlines to the issuer.'}
                            else
                            {
                                let {lines} = issuerTrustlinesResponse
                                let elligibleLines = lines.filter(trustline=>Math.abs(Number(trustline.balance))>=Number(amount))
                                let elligibleLineAddresses = elligibleLines.map(line=>line.account)
                                usableWallets = wallets.filter((wallet)=>elligibleLineAddresses.includes(wallet.address))
                            }
                        }
                        if(usableWallets.length === 0)  return {result:'warn',message:'There are no usable wallets to purchase NFTs with.'}
                        else
                        {
                            let numberOfNFTs= await askForNumberMinMax(`How many NFTs do you want to purchase (0:Cancel | Max:${nftsAvailable.length}):`,0,nftsAvailable.length)
                            if(numberOfNFTs === 0)  return {result:'warn',message:'Purchase cancelled.'}
                            else
                            {
                                let {type,code,hex,issuer,amount} = currency
                                for(let i =0;i<Number(numberOfNFTs);i++)
                                {
                                    let randomAccount = Math.floor(Math.random()*usableWallets.length)
                                    let tx = {
                                        "TransactionType":"Payment",
                                        "Account":usableWallets[randomAccount].address,
                                        "Destination":paymentAccountAddress,
                                    }
                                    
                                    if(type ==='IC') 
                                    {
                                        tx.Amount = {
                                            "currency":hex,
                                            "issuer":issuer,
                                            "value":amount
                                        }
                                    }
                                    else tx.Amount = amount
                                    
                                    // let randomWait = Math.floor(Math.random()*15000)+Math.floor(Math.random()*15000)
                                    // if(randomWait<12000) randomWait = 0
                                    // infoMessage(`Waiting ${randomWait/1000} seconds before sending payment...`)
                                    // await wait(randomWait)
                                    infoMessage(`Purchasing NFT ${i+1} of ${numberOfNFTs} on account ${usableWallets[randomAccount].address}...`)
                                    let txMessage =`Sending sending On-Demand payment of ${amount} $${type==='IC'?code:'XRP'} to ${paymentAccountAddress} on account ${usableWallets[randomAccount].address}.`
                                    let txOptions= {verbose:true,verify:false,txMessage:txMessage,askConfirmation:false}
                                    let txResult = await transactionHandler(networkRPC,tx,usableWallets[randomAccount],txOptions)
                                    printResponse(txResult)
                                    console.log()
                                }
                                return {result:'success',message:`${numberOfNFTs} on demand payments sent.`}
                                
                            }
                        }
                    }
                }
            }
        }
        catch(err)
        {
            console.log('There was a problem purchasing simple distribution NFTs:',err)
        }
}


/*







            let accountObjectsResponse = await getAccountObjects(networkRPC,nftTreasury,'nft_offer')
            printResponse(accountObjectsResponse)
            if(accountObjectsResponse.result !== 'success') return {result:'warn',message:'There was a problem getting the account objects.'})
            else
            {
                let {objects} = accountObjectsResponse
                
                let offersInDistribution= nfts.filter(nft=>nft.status === 'offer-created')
                let offersInDistributionIDs = offersInDistribution.map(nft=>nft.offer.offerID)
                let acceptableOffers = objects.filter(object=>offersInDistributionIDs.includes(object.index))

                if(distributionType !== 'On-Demand Distribution') return return {result:'warn',message:'This distribution is not an On-Demand distribution'})
                else if(acceptableOffers.length === 0) return return {result:'warn',message:'There are no nft offers to accept in this distribution. Did you get the offer ids?'})
                else
                {
                    let testWalletsResponse = await getTestWallets()
                    printResponse(testWalletsResponse)
                    if(testWalletsResponse.result === 'warn') return {result:'warn',message:'No test wallets found.'})
                    else
                    {
                        let {wallets} = testWalletsResponse
                        let {type,code,hex,issuer,amount} = currency
                        let usableWallets = []
                        if(typeof currency !=='IC')
                        {
                            usableWallets = wallets
                            //TODO: CHECK SPENDABLE BALANCE OF EACH WALLET
                            // if(Number(amount)===0) usableWallets = wallets
                            // else
                            // {
                            //     for(let i = 0;i<wallets.length;i++)
                            //     {
                            //         let wallet = wallets[i]
                            //         let xrpBalanceResponse = await get
                            //     }
                            // }
                        } 
                        else
                        {
                            let issuerTrustlinesResponse = await getAllTrustlinesToAnIssuer(networkRPC,issuer);
                            printResponse(issuerTrustlinesResponse)
                            if(issuerTrustlinesResponse.result !== 'success') return {result:'failed',message:'There was a problem getting trustlines to the issuer.'})
                            else
                            {
                                let {trustlines} = issuerTrustlinesResponse
                                console.log(trustlines[0])
                                await pressAnyKey()
                                let trustlineAccounts = trustlines.map(trustline=>trustline.account)
                                usableWallets = wallets.filter(wallet=>trustlineAccounts.includes(wallet.address) ) //&& wallet.balance>=amount
                                console.log(usableWallets.length)
                                await pressAnyKey()
                                
                            }
                        }
                        if(usableWallets.length === 0) return return {result:'warn',message:'There are no usable wallets to purchase NFTs with.'})
                        else
                        {
                            let numberOfNFTs= await askForNumberMinMax(`How many NFTs do you want to purchase (0:Cancel | Max:${acceptableOffers.length}):`,0,acceptableOffers.length)
                            if(Number(numberOfNFTs) === 0) return return {result:'warn',message:'Purchase cancelled.'})
                            else
                            {
                                for(let i =0;i<Number(numberOfNFTs);i++)
                                {
                                    let randomAccount = Math.floor(Math.random()*usableWallets.length)
                                    let tx = {
                                        "TransactionType":"NFTokenAcceptOffer",
                                        "Account":usableWallets[randomAccount].address,
                                        "NFTokenSellOffer":acceptableOffers[i].index,
                                    }
                                    infoMessage(`Purchasing NFT ${i+1} of ${numberOfNFTs} on account ${usableWallets[randomAccount].address}...`)
                                    let txMessage =`Purchasing NFT ${acceptableOffers[i].NFTokenID} on account ${usableWallets[randomAccount].address} \n by accepting offer ${acceptableOffers[i].index}`
                                    let txOptions= {verbose:true,verify:false,txMessage:txMessage,askConfirmation:false}
                                    let txResult = await transactionHandler(networkRPC,tx,usableWallets[randomAccount],txOptions)
                                    printResponse(txResult)
                                    console.log()
                                }
                                return {result:'success',message:`${numberOfNFTs} NFTs purchased.`})
                            }
                        }
                    }
                }
            }

*/