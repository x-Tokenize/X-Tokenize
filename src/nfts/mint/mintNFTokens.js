import { configHandler } from "../../config/configHandler.js";
import { getLatestLedger,mintNFToken } from "../../xrpl/index.js";
import { printBanner, printResponse, createSpinner,wait } from "../../utils/index.js";

 /**
 * @function initializeNFTokenMint
 * @description
 * Initializes the NFT mint process by updating the current configuration and setting the status of the
 * NFT mint. It also retrieves the latest ledger index to be used in the minting process.
 * 
 * @param {Object} currentConfig - The current configuration object containing NFT, NFT_MINT, and other settings.
 * @returns {Promise<Object>} - An object containing the result, message, and ledgerIndexMax (if successful).
 * @property {string} result - The result of the initialization process.
 * @property {string} message - A message describing the result of the initialization process.
 * @property {number} [ledgerIndexMax] - The latest ledger index retrieved from the network.
 * @throws {Error} - If there is a problem initializing the NFT mint.
 */
export const initializeNFTokenMint = async(currentConfig)=>{
        try
        {
            let latestLedgerResponse = await getLatestLedger(currentConfig.NFT.networkRPC)
            if(latestLedgerResponse.result==='success')
            {
                let ledgerIndex = Number(latestLedgerResponse.ledger.ledger_index)
                if(currentConfig.NFT_MINT.status ==='created')
                {
                    currentConfig.NFT_MINT.status='active'
                    currentConfig.NFT_MINT.ledgerIndexStart = ledgerIndex
                    await configHandler.updateCurrentConfig(currentConfig)
                    return {result:'success',message:'The NFT mint was initialized successfully.',ledgerIndexMax:ledgerIndex}
                }
                else if(currentConfig.NFT_MINT.status === 'active')return {result:'success',message:'The NFT mint is already active.',ledgerIndexMax:ledgerIndex}
                else if(currentConfig.NFT_MINT.status === 'completed')return {result:'warn',message:'The NFT mint is already completed.'}
                else return {result:'warn',message:'The NFT mint is not ready to be initialized.'}
            }
            else
            {
                warningMessage(`There was a problem attempting to initialize the NFT mint. Trying again in 10 seconds...`)
                await wait(10000)
                return await initializeNFTokenMint(currentConfig)
            }
        }
        catch(err)
        {
            console.log('There was a problem initializing the NFT mint: ',err)
        }
}

/**
 * @function mintNFTokens
 * @description
 * Mints NFT tokens based on the current configuration and wallet provided. It initializes the NFT mint,
 * processes each item in the NFT_MINT configuration, and updates the current configuration after each minting transaction.
 * 
 * @param {Object} wallet - The wallet object containing the user's wallet information.
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the minting process.
 * @throws {Error} - If there is a problem minting the NFTs.
 */
export const mintNFTokens = async(wallet)=>{
        try
        {
            let currentConfig = configHandler.getConfigs();
            let {NFT,NFT_MINT,XTOKENIZE_SETTINGS} = currentConfig;
            let {networkRPC,minter,authorizedMinting,} = NFT;
            let {transferable,transferFee,onlyXRP,burnable,tokenTaxon,} = NFT_MINT;
            let {throttle,txs_before_sleep,sleep_time} = XTOKENIZE_SETTINGS
            printBanner()
            let initializeResult = await initializeNFTokenMint(currentConfig);
            if(initializeResult.result!== 'success') return initializeResult
            else
            {
                let items = NFT_MINT.items
                let txOptions = {verify:false,verbose:false,txMessage:null,askConfirmation:false}
                let nftokenMintOptions ={transferable,transferFee,onlyXRP,burnable,tokenTaxon,authorizedMinting,minter:minter.address}
                 let spinner = await createSpinner(`Executing NFTokenmint transactions... 0/${items.length}`)
                let pendingItems = items.filter(item=>item.status==='pending' && item.txHash===null)
                let itemsProcessed = 0;
                for await(let item of pendingItems)
                {
                    throttle?await wait(throttle):null
                    txs_before_sleep?(itemsProcessed%txs_before_sleep===0 && itemsProcessed>0)?await wait(sleep_time):null:null
                    let mintResult = await mintNFToken(networkRPC,wallet,item.uri,nftokenMintOptions,txOptions)
                    if(mintResult.result==='success') item.status = 'sent';
                    else item.status = 'failed';          
                    item.txHash = mintResult.hash
                    item.preliminaryResult=mintResult.code 
                    await configHandler.updateCurrentConfig(currentConfig)
                    itemsProcessed++
                     spinner.message(`Executing NFTokenmint transactions... ${itemsProcessed}/${items.length}`)
                }
                 spinner.stop()
                console.log()
                let ledgerIndexEndResponse= await getLatestLedger(networkRPC)
                printResponse(ledgerIndexEndResponse)
                if(ledgerIndexEndResponse.result==='success') NFT_MINT.ledgerIndexEnd = Number(ledgerIndexEndResponse.ledger.ledger_index)
                NFT_MINT.status='pendingVerification'
                await configHandler.updateCurrentConfig(currentConfig)
                return {result:'success',message:'Success running the mint.'}
            }
        }
        catch(err)
        {
            console.log('There was a problem minting the NFTs.',err)
        }
}