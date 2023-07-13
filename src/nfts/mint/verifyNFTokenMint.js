import { configHandler } from "../../config/configHandler.js";
import { printBanner,createSpinner,warningMessage,printResponse,infoMessage,pressAnyKey,askYesNo,wait, table } from "../../utils/index.js";
import { getAccountTransactions,getLatestLedger,getNFTokenIdFromTx } from "../../xrpl/index.js";

 /**
 * @function verifyNFTokenMint
 * @description
 * This function is responsible for verifying the minting status of NFTs. It checks if the NFTs have
 * already been minted, if there are any pending items to be minted, and verifies the transactions for each item. It
 * also handles failed transactions and allows the user to reset the item and try minting again. The function updates
 * the current configuration with the verification results and displays a summary table of the mint verification process.
 * 
 * @returns {OperationResult} - An object containing the result and a message describing the outcome of the verification process.
 * @throws {Error} - If there is a problem during the verification process, an error message is logged.
 */
export const verifyNFTokenMint = async()=>{
        try
        {
            printBanner()
            let currentConfig = configHandler.getConfigs();
            let {NFT,NFT_MINT,XTOKENIZE_SETTINGS} = currentConfig;
            let {network,networkRPC,minter,authorizedMinting,authorizedMinter} = NFT;
            let {status,items,ledgerIndexStart,ledgerIndexEnd} = NFT_MINT;
            let accountToCheck = authorizedMinting?authorizedMinter.address:minter.address
            if(status==='completed') return {result:'success',message:'The NFTs have already been minted.'}
            else {
                let pendingItems = items.filter(item=>item.status==='pending')
                if(pendingItems.length>0)return {result:'warn', message:`There are still ${pendingItems.length} pending items to be minted. Please run the mint again.`}
                else
                {
                    let latestLedgerResponse = await getLatestLedger(networkRPC)
                    if(latestLedgerResponse.result !== 'success') return {result:'warn',message:'There was a problem getting the latest ledger index. Please try again.'}
                    else
                    {
                        let latestLedger = latestLedgerResponse.ledger.ledger_index
                        if(latestLedger<XTOKENIZE_SETTINGS.max_ledger_offset+NFT_MINT.ledgerIndexEnd) return {result:'warn',message:`The latest ledger index is ${latestLedger}. Please wait until the ledger index is at least ${XTOKENIZE_SETTINGS.max_ledger_offset+NFT_MINT.ledgerIndexEnd} before verifying the mint.`}
                        else
                        { 
                            let accountTxOptions = {ledger_index_min:Number(ledgerIndexStart)}
                            let spinner = await createSpinner(`Getting account transactions from ledger ${ledgerIndexStart} to ${ledgerIndexEnd}...`)

                            let accountTxs = await getAccountTransactions(networkRPC,accountToCheck,accountTxOptions)
                            spinner.stop()
                            printResponse(accountTxs)
                            if(accountTxs.result!=='success') return {result:'failed',message:'There was a problem getting the transactions.'}
                            else
                            {
                                let {transactions} = accountTxs
                                let items = NFT_MINT.items;
                                spinner.message(`Verifying mint transactions... 0/${items.length} items checked.`)
                                spinner.start()
                                for(let i = 0;i<items.length;i++)
                                {
                                    let item = items[i]
                                    if(item.status ==='sent' && item.txHash!==null)
                                    {
                                        let txFound = transactions.find(transaction=>transaction.tx.hash===item.txHash)
                                        if(txFound)
                                        {
                                            let {tx,meta} =txFound
                                            if(meta.TransactionResult==='tesSUCCESS')
                                            {
                                                item.status = 'verified'
                                                item.minted = true
                                                item.nftokenID= getNFTokenIdFromTx(txFound)
                                                item.finalResult = 'tesSUCCESS'
                                                item.ledgerIndex=tx.inLedger
                                                NFT_MINT.successfullMints++;   
                                            }
                                            else
                                            {
                                                spinner.stop()
                                                warningMessage(`It looks like this tx failed with resulting code: ${meta.TransactionResult}`)
                                                infoMessage(`Tx Hash: ${item.hash}`)
                                                if(await askYesNo(`Would you like to reset this item and try minting it again by running the mint again?`),true)
                                                {
                                                    if(NFT_MINT.status!=='active') NFT_MINT.status='active'
                                                    item.status = 'pending';
                                                    item.txHash=null;
                                                    item.preliminaryResult=null;
                                                }
                                                else
                                                {
                                                    item.status = 'failed'
                                                    item.finalResult = meta.TransactionResult
                                                    item.ledgerIndex = tx.inLedger
                                                    NFT_MINT.failedMints++;
                                                }
                                            spinner.start()
                                            }
                                        }
                                        else
                                        {
                                            spinner.stop()
                                            warningMessage(`It looks like the following transaction hash from the distribution was not found in the accounts transactions:`)
                                            infoMessage(`Tx Hash: ${item.txHash}`)
                                            infoMessage(`Transaction preliminary result: ${item.preliminaryResult}`)
                                            if(await askYesNo(`Would you like to reset this item and try minting it again by running the mint again?`),true)
                                            {
                                                if(NFT_MINT.status !== 'active')NFT_MINT.status='active'
                                                item.status='pending'
                                                item.txHash=null
                                                item.preliminaryResult=null
                                            }
                                            else
                                            {
                                                item.status='failed'
                                                item.finalResult = 'txNotFound'
                                                item.ledgerIndex=null
                                                NFT_MINT.failedDistributions++;
                                            }
                                            spinner.start()
                                        }
                                    }
                                    await configHandler.updateCurrentConfig(currentConfig)
                                    spinner.message(`Verifying mint transactions...  ${i+1}/${items.length} items checked.`)
                                    await wait(5)
                                }
                                spinner.stop()
                                let pendingItems = items.filter(item=>item.status==='pending')
                                if(pendingItems.length>0)  NFT_MINT.status = 'active'
                                else NFT_MINT.status = 'completed'
                                await configHandler.updateCurrentConfig(currentConfig)
                                let data ={"Total NFTs Checked:" : items.length,"Total Successful Mints":NFT_MINT.successfullMints,"Total Failed Mints":NFT_MINT.failedMints,"Total Pending Mints":pendingItems.length}
                                table([data])
                                return {result:'success',message:'Mint verification completed.'}

                            }
                        }
                    }
                }
            }
        }
        catch(err)
        {
            console.log('There was a problem verifying the mint:',err)
        }
}