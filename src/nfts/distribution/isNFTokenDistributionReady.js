import { fancyMessage, infoMessage, successMessage, warningMessage, printResponse,pressAnyKey, askYesNo } from "../../utils/index.js";
import { checkAccountExists,setTrustline,getAccountNFTs, getSpecificTrustline } from "../../xrpl/index.js"


/**
 * @function isNFTokenDistributionReady
 * @description
 * This function checks if the NFToken distribution is ready by verifying the existence of accounts,
 * payment method readiness, and presence of NFTs. It checks if the accounts exist, if the payment method is ready on
 * all accounts, and if the NFTs are ready. If any of these conditions are not met, the function returns false. If all
 * conditions are met, the function returns true.
 * 
 * @param {string} network - The network to be used.
 * @param {string} networkRPC - The network RPC URL.
 * @param {Array} nfts - An array of NFT objects.
 * @param {string} distributionType - The type of distribution.
 * @param {Object} paymentAccount - The payment account object.
 * @param {Object} currency - The currency object.
 * @param {Object} minter - The minter account object.
 * @param {boolean} authorizedMinting - A boolean indicating if authorized minting is enabled.
 * @param {Object} authorizedMinter - The authorized minter account object.
 * @returns {Promise<boolean>} - Returns true if the NFToken distribution is ready, otherwise returns false.
 * @throws {Error} - Throws an error if there is a problem checking if the NFToken distribution is ready.
 */
export const isNFTokenDistributionReady = async(network,networkRPC,nfts,distributionType,paymentAccount,currency, minter, authorizedMinting,authorizedMinter)=>{
        try{
            let txOptions = {verify:true,verbose:true,txMessage:null,askConfirmation:true}
            let accountsExist = true
            let paymentsReady = true
            let nftsReady = false

            fancyMessage(`Checking if the NFToken distribution is ready...`)
            console.log();
    
            infoMessage(`Checking if the accounts exist...`)

            let accountsToCheck = [minter]
            if(authorizedMinting) accountsToCheck.push(authorizedMinter)
            if(paymentAccount) accountsToCheck.push(paymentAccount)

            for(let i=0;i<accountsToCheck.length;i++)
            {
                console.log()
                infoMessage(`Checking if ${accountsToCheck[i].address} exists...`)
                let accountExists = await checkAccountExists(network,networkRPC,accountsToCheck[i].address)
                if(accountExists.result === 'success') successMessage(`The account ${accountsToCheck[i].address} exists.`)
                else
                {
                    printResponse(accountExists)
                    accountsExist = false;
                    break;
                }
            }
            console.log()

            if(accountsExist)
            {
                successMessage(`All accounts exist.`)
                console.log();

                infoMessage(`Checking if the payment method is ready on all accounts...`)
                console.log()
                let {type,code,hex,issuer,amount} = currency;
                if(type !=='IC'){
                    infoMessage(`Looks like we are not using an IC.`)
                    successMessage(`The payment method is ready.`)
                    paymentsReady=true;
                }
                else
                {
                    warningMessage(`Looks like we are using an IC.`)

                    for(let i = 0; i <accountsToCheck.length;i++)
                    {
                        console.log()
                        infoMessage(`Checking if ${accountsToCheck[i].address} has a trustline set...`)
                        let accountTrustlineResponse = await getSpecificTrustline(networkRPC,hex,issuer,accountsToCheck[i].address)
                        printResponse(accountTrustlineResponse)
                        console.log()
                        if(accountTrustlineResponse.result==='success') successMessage(`The trustline for ${accountsToCheck[i].address} already exists.`)
                        else if(accountTrustlineResponse.result==='warn')
                        {
                            if(await askYesNo(`Would you like to set the trustline on ${accountsToCheck[i].address} for $${code} issued by ${issuer}?`))
                            {
                                accountTrustlineResponse = await setTrustline(networkRPC,issuer,hex,accountsToCheck[i],{},txOptions)
                                printResponse(accountTrustlineResponse)
                                if(accountTrustlineResponse.result==='success') successMessage(`The trustline on ${accountsToCheck[i].address} was set.`)
                                else
                                {
                                    warningMessage(`The trustline for ${accountsToCheck[i].address} is not set.`)
                                    paymentsReady = false;
                                    break;
                                }
                            }
                            else 
                            {
                                warningMessage(`User declined to set the trustline.`)
                                paymentsReady = false;
                                break;
                            }
                        }
                        else
                        {
                            warningMessage(`The trustline for ${accountsToCheck[i].address} is not set.`)
                            paymentsReady = false;
                            break;
                        }
                    }
                }
            }
            else
            {
                warningMessage(`Some accounts are missing...`)
                paymentsReady = false;
            }

            console.log()
            infoMessage(`Checking if the NFTs are ready...`)
            console.log()
            let nftTreasury = authorizedMinting?authorizedMinter:minter
            infoMessage(`Getting NFTs on ${nftTreasury.address}...`)
            let nftsResponse = await getAccountNFTs(networkRPC,nftTreasury.address)
            printResponse(nftsResponse)
            if(nftsResponse.result !== 'success') nftsReady = false;
            else
            {
                console.log()
                infoMessage(`Looking for missing NFTs...`)
                let nftokenIDs = nftsResponse.nfts.map(nft=>nft.NFTokenID)
                nftsReady = true;
                for(let i = 0; i < nfts.length;i++)
                {
                    if(nfts[i].status ==='pending' && !nftokenIDs.includes(nfts[i].nftokenID))
                    {
                        nftsReady = false;
                        console.log()
                        warningMessage(`The NFT ${nfts[i].nftokenID} is missing.`)
                        await pressAnyKey()
                    }
                }
                //TODO:CHECK RESERVE REQUIREMENTS

            }

            if(nftsReady) successMessage(`All NFTs are present.`)
            else warningMessage(`Some NFTs are missing.`)
            console.log()

            if(accountsExist && paymentsReady && nftsReady)
            {
                successMessage(`The NFToken distribution is ready.`)
                await pressAnyKey()
                return true
            }
            else
            {
                warningMessage(`Some of the prerequisites for the NFToken distribution are not ready.`)
                infoMessage(`Accounts exist: ${accountsExist}`)
                infoMessage(`Payments ready: ${paymentsReady}`)
                infoMessage(`NFTs ready: ${nftsReady}`)
                return false
            }
        }
        catch(err)
        {
            console.log('There was a problem checking if the NFToken distribution is ready:',err)
        }
}