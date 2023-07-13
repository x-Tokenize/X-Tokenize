import {configHandler} from '../config/configHandler.js'
import { askForNumberMinMax, askYesNo, importantMessage, infoMessage,pressAnyKey,printBanner,printResponse, warningMessage,} from '../utils/index.js'
import {  transactionHandler,getAccountObjects} from '../xrpl/index.js'
import {getTestWallets} from './testWallets.js'

 /**
 * @function claimOnDemandNFTsFromDistribution
 * @description
 * This function is responsible for claiming on-demand NFTs from a distribution. It checks if there is a
 * distribution loaded, and if not, it prompts the user to load one. If a distribution is loaded, it retrieves the test
 * wallets and account objects for the NFT treasury. It then filters the NFTs that are available for claiming and
 * prompts the user to specify how many NFTs they want to claim. The function then generates and submits the
 * transactions for claiming the specified number of NFTs.
 * 
 * @param {boolean} loaded - Indicates if a distribution is already loaded.
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the operation.
 * @throws {Error} - Throws an error if there is a problem claiming on-demand NFTs.
 */

export const claimOnDemandNFTsFromDistribution = async(loaded)=>{
        try
        {
            let currentConfig = await configHandler.getConfigs()
            if(typeof currentConfig.NFT_DISTRIBUTION.name === typeof undefined)
            {
                infoMessage(`It looks like there isn't a distribution loaded.`)
                await configHandler.selectConfig('NFT_DISTRIBUTION')
                return await claimOnDemandNFTsFromDistribution(true)
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
                return await claimOnDemandNFTsFromDistribution(true)
            }
            else
            {
                printBanner()
                currentConfig = await configHandler.getConfigs()
                let {NFT,NFT_DISTRIBUTION} = currentConfig
                let {networkRPC,minter,authorizedMinting,authorizedMinter} = NFT
                let {nfts,currency,distributionType,paymentAccount} = NFT_DISTRIBUTION
                let nftTreasury = authorizedMinting?authorizedMinter.address:minter.address

                if(distributionType !== 'On-Demand Distribution') return {result:'failed',message:`This distribution is not an On-Demand distribution.`}
                else
                {
                    let walletsResponse = await getTestWallets();
                    if(walletsResponse.result!=='success') return {result:'failed',message:`No test wallets found.`}
                    else
                    {
                        let {wallets } = walletsResponse;
                        let walletAddresses = wallets.map(wallet=>wallet.address)

                        let accountObjectsResponse = await getAccountObjects(networkRPC,nftTreasury,'nft_offer')
                        printResponse(accountObjectsResponse)
                        if(accountObjectsResponse.result !== 'success') return {result:'warn',message:'There was a problem getting the account objects.'}
                        else
                        {
                            let {objects} = accountObjectsResponse
                            let offersInDistribution= nfts.filter(nft=>nft.status === 'offer-created')
                            let offersInDistributionIDs = offersInDistribution.map(nft=>nft.offer.offerID)
                            let acceptableOffers = objects.filter(object=>offersInDistributionIDs.includes(object.index))
                            let claimableNFTs = acceptableOffers.filter(offer=>(  walletAddresses.includes(offer.Destination) && offer.Amount==='0'));
                            infoMessage(`There are ${claimableNFTs.length} NFTs available to claim.`)
                            console.log()
                            
                            let howMany = await askForNumberMinMax(`How many NFTs do you want to claim? (Cancel:0, Max:${claimableNFTs.length})`,0,claimableNFTs.length)
                            if(howMany == 0) return {result:'warn',message:'User cancelled NFT claim.'}
                            else
                            {
                                let txOptions= {verbose:true,verify:false,txMessage:null,askConfirmation:false}
                                for(let i = 0; i<howMany;i++)
                                {
                                    let offerToAccept = claimableNFTs[i]
                                    let {NFTokenID,Destination,index} = offerToAccept
                                    let wallet =  wallets.find(wallet=>wallet.address === Destination)
                                    let tx={
                                        "TransactionType":"NFTokenAcceptOffer",
                                        "Account":Destination,
                                        "NFTokenSellOffer":index,
                                    }
                                    txOptions.txMessage = `Claiming On-Demand NFT ${NFTokenID} on account ${Destination} \n by accepting offer ${index}`
                                    let txResult = await transactionHandler(networkRPC,tx,wallet,txOptions)
                                    printResponse(txResult)
                                    console.log()
                                }
                            }
                            return {result:'success',message:'Successfully claimed On-Demand NFTs.'}
                         }

                    }
                }
            }
    
        }
        catch(err)
        {
            console.log("There was a problem claiming on-demand NFTs: ",err)
        }
   
}