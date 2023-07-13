import { askForNumberMinMax, askWhichFromList, askYesNo, fancyMessage, infoMessage,askForAddress} from "../../utils/index.js";
import {createNFTokenOffer, getAccountNFTs,getXrpBalance} from "../../xrpl/index.js";
import xrpl from 'xrpl'



 /**
 * @function createBuyOfferForNFT
 * @description
 * This function prompts the user to provide the address of the account they would like to buy an NFT
 * from, then retrieves the NFTs owned by that account and allows the user to select which NFT they would like to buy.
 * The user is then prompted to enter the amount of XRP they would like to offer for the selected NFT. The function then
 * creates a buy offer for the NFT using the provided information.
 * 
 * @param {string} networkRPC - The network RPC object used for interacting with the XRPL.
 * @param {object} account - The account object containing the account's address and secret.
 * @returns {OperationResult} - An object containing the result and a message describing the NFTokenBuyOffer creation outcome.
 * @throws {string} - A string describing the error that occurred during the buy offer creation process.
 */
export  const createBuyOfferForNFT = async (networkRPC,account) =>{
    try{
        //TODO: ADD IC SUPPORT
        fancyMessage(`IC support coming soon!`)
        let xrpBalanceResponse = await getXrpBalance(networkRPC,account.address)
        if(xrpBalanceResponse.result!=='success') return xrpBalanceResponse
        else
        {
            let {spendable} = xrpBalanceResponse
            infoMessage(`Please provide the address of the account you would like to buy an NFT from.`)
            let addressToBuyFrom = await askForAddress()
            if(addressToBuyFrom==='0') return {result:'warn',message:'User cancelled NFT offer creation.'}
            else
            {
                let accountNFTs = await getAccountNFTs(networkRPC,addressToBuyFrom)
                if(accountNFTs.result!=='success') return accountNFTs
                else
                {
                    let {nfts} = accountNFTs
                    if(nfts.length === 0) return {result:'warn',message:`The account you are trying to buy an NFT from does not have any NFTs.`}
                    let NFTokenIDS = nfts.map(nft=>nft.NFTokenID)
                    NFTokenIDS.push('Cancel')
                    let NFTokenIDToBuy = await askWhichFromList(`Which NFT would you like to buy?`,NFTokenIDS)
                    if(NFTokenIDToBuy==='Cancel') return {result:'warn',message:`User cancelled NFT offer creation.`}
                    else
                    {
                        let offerAmount = await askForNumberMinMax(`How much XRP would you like to offer for this NFT?(0:Cancel) (MAX:${spendable})`,0.000001,spendable)
                        if(offerAmount===0) return {result:'warn',message:`User cancelled NFT offer creation.`}
                        else
                        {
                            let nftokenOfferOptions = {sale:false,owner:addressToBuyFrom}
                            let txOptions = {verbose:true,askConfirmation:true,verify:true}
                            return await createNFTokenOffer(networkRPC,account,NFTokenIDToBuy,xrpl.xrpToDrops(offerAmount),nftokenOfferOptions,txOptions)
                        }
                    }
                }
            }
        }
    }
    catch(err)
    {
        console.log(`There was a problem creating a buy offer for an NFT: ${err}`)
    }
}

/**
 * @function createSellOfferForNFT
 * @description
 * This function retrieves the NFTs owned by the user's account and allows the user to select which NFT
 * they would like to sell. The user is then prompted to enter the amount of XRP they would like to sell the selected
 * NFT for and optionally specify a recipient address for the offer. The function then creates a sell offer for the NFT
 * using the provided information.
 * 
 * @param {string} networkRPC - The network RPC object used for interacting with the XRPL.
 * @param {object} account - The account object containing the account's address and secret.
 * @returns {OperationResult} - An object containing the result and a message describing the NFTokenSellOffer creation outcome.
 * @throws {string} - A string describing the error that occurred during the sell offer creation process.
 */
export  const createSellOfferForNFT = async (networkRPC,account) =>{
    try
    {
        //TODO: ADD IC SUPPORT
        fancyMessage(`IC support coming soon!`)
        let accountNFTs = await getAccountNFTs(networkRPC,account.address)
        if(accountNFTs.result!=='success') return accountNFTs
        else
        {
            let {nfts} = accountNFTs
            if(nfts.length===0)return {result:'warn',message:`You don't have any NFTs to sell.`}
            else
            {
                let NFTokenIDS = nfts.map(nft=>nft.NFTokenID)
                NFTokenIDS.push('Cancel')
                let NFTokenIDToSell = await askWhichFromList(`Which NFT would you like to sell?`,NFTokenIDS)
                if(NFTokenIDToSell==='Cancel') return {result:'warn',message:`User cancelled NFT offer creation.`}
                else
                {
                    let nftokenOfferOptions = {sale:true,destination:undefined,expiration:undefined,owner:undefined}
                    let txOptions = {verbose:true,askConfirmation:true,verify:true}
                    if(await askYesNo(`Would you like to specify a recipient address for this NFT offer?`))
                    {
                        let addressToSellTo = await askForAddress()
                        if(addressToSellTo==='0') return {result:'warn',message:'User cancelled NFT offer creation.'}
                        else nftokenOfferOptions.destination=addressToSellTo
                    }
                    let xrpAmount = await askForNumberMinMax(`How much XRP would you like to sell this NFT for?(-1:Cancel)`,-1,Number.MAX_SAFE_INTEGER)
                    if(xrpAmount===-1) return {result:'warn',message:`User cancelled NFT offer creation.`}
                    else return await createNFTokenOffer(networkRPC,account,NFTokenIDToSell,xrpl.xrpToDrops(xrpAmount),nftokenOfferOptions,txOptions)
                }
            }
        }
    }
    catch(err)
    {
        console.log(`There was a problem creating a sell offer for an NFT: ${err}`)
    }
}

/**
 * @function createAnOfferForAnNFT
 * @description
 * This function prompts the user to choose whether they would like to buy or sell an NFT. Depending on
 * the user's choice, the function then calls either the createBuyOfferForNFT or createSellOfferForNFT function to
 * create the corresponding offer for the NFT.
 * 
 * @param {string} networkRPC - The network RPC object used for interacting with the XRPL.
 * @param {object} account - The account object containing the account's address and secret.
 * @returns {OperationResult} - An object containing the result and a message describing the NFTokenOffer creation outcome.
 * @throws {string} - A string describing the error that occurred during the NFT offer creation process.
 */
export const createAnOfferForAnNFT = async (networkRPC,account) =>{
    try
    {
        let buyOrSell = await askWhichFromList(`Would you like to buy or sell an NFT?`,[`Buy`,`Sell`,`Cancel`])
        if(buyOrSell==='Cancel') return {result:'warn',message:`User cancelled NFT offer creation.`}
        else if(buyOrSell === 'Buy') return await createBuyOfferForNFT(networkRPC,account)
        else return await createSellOfferForNFT(networkRPC,account)
    }
    catch(err)
    {
        console.log(`There was a problem creating an offer for an NFT: ${err}`)
    }
}