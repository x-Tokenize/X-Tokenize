import { askWhichFromList,  pressAnyKey, printBanner, printResponse, selectAConfigAccountWithNetwork,} from "../../utils/index.js";
import {checkAccountExists} from "../../xrpl/index.js";
import { createAnOfferForAnNFT } from "./createNFTokenOffers.js";
import { getAndHandleIncomingOffers } from "./incomingNFTokenOffers.js";
import { getAndHandleOutgoingOffers } from "./outgoingNFTokenOffers.js";


/**
 * @function initializeMarketplace
 * @description
 * Initializes the NFT marketplace by selecting a configuration account with a network and checking if the
 * account exists on the XRPL. If successful, returns an object containing the account, networkRPC, and network.
 * 
 * @param {string} config_type - The type of configuration to be used for selecting an account with a network.
 * @returns {Promise<Object>} - An object containing the result, message, account, networkRPC, and network if
 * successful, or an error object if not.
 * @throws Error if there is a problem initializing the NFT marketplace.
 */
const initializeMarketplace = async(config_type)=>{
    try
    {
        let accountToUseResponse = await selectAConfigAccountWithNetwork(config_type)
        if(accountToUseResponse.result!=='success') return accountToUseResponse
        else
        {
            let {account,networkRPC,network}=accountToUseResponse
            let accountExistsResult = await checkAccountExists(network,networkRPC,account.address)
            if(accountExistsResult.result!=='success') return accountExistsResult
            else return {result:'success',message:'Success initializing account for marketplace.',account:account,networkRPC:networkRPC,network:network}
        }
    }
    catch(err)
    {
        console.log(`There was a problem initializing the nft marketplace: ${err}`)
    }

}


/**
 * @function marketplace
 * @description
 * Handles the NFT marketplace functionality by initializing the marketplace, presenting the user with
 * options to browse NFTs, create NFT offers, manage incoming and outgoing NFT offers, or cancel. Calls the appropriate
 * functions based on the user's choice and recursively calls itself until the user chooses to exit.
 * 
 * @param {string} config_type - The type of configuration to be used for selecting an account with a network.
 * @param {Object} [loadedConfig] - An optional pre-loaded configuration object containing account,
 * networkRPC, and network.
 * @returns {OperationResult} - An object containing the result and a message describing the marketplace execution result.
 * @throws Error if there is a problem using the NFT marketplace.
 */
export const marketplace = async (config_type,loadedConfig)=>{
    try
    {
        let initMarketplace = loadedConfig?loadedConfig:await initializeMarketplace(config_type);
        if(initMarketplace.result!=='success') return initMarketplace
        else
        {
            printBanner()
            let {account,networkRPC} = initMarketplace
            let options=[`Browse NFTs`,`Create NFT offer`, `Manage Incoming NFT offers`, `Manage Outgoing NFT offers`,`Cancel` ]
            let marketplaceManageType = await askWhichFromList(`What would you like to do?`,options)
            if(marketplaceManageType==='Cancel') return {result:'warn',message:'User exited the nft marketplace.'}
            else
            {
                let result 
                switch(marketplaceManageType)
                {
                    case 'Browse NFTs':
                        result = {result:'success',message:`Coming soon!`}
                        break;
                    case 'Create NFT offer':
                        result =  await createAnOfferForAnNFT(networkRPC,account)
                        break;
                    case 'Manage Incoming NFT offers':
                        result = await getAndHandleIncomingOffers(networkRPC,account)
                        break;
                    case 'Manage Outgoing NFT offers':
                        result = await getAndHandleOutgoingOffers(networkRPC,account)
                }
                printResponse(result)
                await pressAnyKey()
                return await marketplace(config_type,initMarketplace)
            }
        }

    }
    catch(err)
    {
        console.log(`There was a problem using the nft marketplace: ${err}`)
    }
}


