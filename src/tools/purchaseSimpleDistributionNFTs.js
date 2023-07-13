import {configHandler} from '../config/configHandler.js'
import { askForNumberMinMax, infoMessage,pressAnyKey,printResponse} from '../utils/index.js'
import { getAllTrustlinesToAnIssuer, transactionHandler,getAccountObjects} from '../xrpl/index.js'
import {getTestWallets} from './testWallets.js'

 /**
 * @function purchaseSimpleDistributionNFTs
 * @description
 * This function is responsible for purchasing NFTs from a simple distribution. It first selects the NFT
 * distribution configuration and retrieves the necessary information. Then, it checks if the distribution is a simple
 * distribution and if there are any NFT offers available. If so, it retrieves the test wallets and filters the usable
 * wallets based on the currency type. The function then prompts the user to enter the number of NFTs they want to
 * purchase and proceeds to purchase the NFTs by accepting the offers on the XRPL.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the operation.
 * @throws {Error} - If there is a problem during the process of purchasing simple distribution NFTs.
 */

export const purchaseSimpleDistributionNFTs=async()=>{
        try
        {
            await configHandler.selectConfig('NFT_DISTRIBUTION')
            let currentConfig = await configHandler.getConfigs()
            let {NFT,NFT_DISTRIBUTION} = currentConfig
            let {networkRPC,minter,authorizedMinting,authorizedMinter} = NFT
            let {nfts,currency,distributionType} = NFT_DISTRIBUTION
            let nftTreasury = authorizedMinting?authorizedMinter.address:minter.address

            let accountObjectsResponse = await getAccountObjects(networkRPC,nftTreasury,'nft_offer')
            printResponse(accountObjectsResponse)
            if(accountObjectsResponse.result !== 'success') return {result:'warn',message:'There was a problem getting the account objects.'}
            else
            {
                let {objects} = accountObjectsResponse
                
                let offersInDistribution= nfts.filter(nft=>nft.status === 'offer-created')
                let offersInDistributionIDs = offersInDistribution.map(nft=>nft.offer.offerID)
                let acceptableOffers = objects.filter(object=>offersInDistributionIDs.includes(object.index))

                if(distributionType !== 'Simple Distribution') return {result:'warn',message:'This distribution is not a simple distribution'}
                else if(acceptableOffers.length === 0) return {result:'warn',message:'There are no nft offers to accept in this distribution. Did you get the offer ids?'}
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
                        if(type === 'XRP')
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
                            if(issuerTrustlinesResponse.result !== 'success') return {result:'failed',message:'There was a problem getting trustlines to the issuer.'}
                            else
                            {
                                let {lines} = issuerTrustlinesResponse
                                let linesWithSufficientBalance = lines.filter(line=>(Number(line.balance)*-1)>=Number(amount))
                                let trustlineAccounts = linesWithSufficientBalance.map(line=>line.account)
                                usableWallets = wallets.filter(wallet=>trustlineAccounts.includes(wallet.address) ) //&& wallet.balance>=amount
                            }
                        }
                        if(usableWallets.length === 0)  return {result:'warn',message:'There are no usable wallets to purchase NFTs with.'}
                        else
                        {
                            let numberOfNFTs= await askForNumberMinMax(`How many NFTs do you want to purchase (0:Cancel | Max:${acceptableOffers.length}):`,0,acceptableOffers.length)
                            if(Number(numberOfNFTs) === 0)  return {result:'warn',message:'Purchase cancelled.'}
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
                                return {result:'success',message:`${numberOfNFTs} NFTs purchased.`}
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