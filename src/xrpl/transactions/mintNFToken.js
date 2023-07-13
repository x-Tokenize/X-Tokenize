import {transactionHandler} from '../core/transactionHandler.js'
import {printResponse} from '../../utils/index.js'
import xrpl from 'xrpl'

 /**
 * @function mintNFToken
 * @description
 * This function is responsible for minting a new non-fungible token (NFT) on the XRPL. It starts by
 * destructuring the input parameters, which include the network RPC, account, URI, NFT options, and transaction
 * options. The function then initializes a flags variable to 0 and updates the flags based on the NFT options provided
 * (transferable, onlyXRP, and burnable). Next, the function constructs the transaction object with the required fields,
 * such as TransactionType, Account, NFTokenTaxon, TransferFee, Flags, and URI. If authorizedMinting is enabled, the
 * Issuer field is also added to the transaction object. The txOptions object is updated with a txMessage describing the
 * minting process. The function then calls the transactionHandler function, passing the networkRPC, transaction object,
 * account, and txOptions as arguments. The transactionHandler function submits the transaction to the XRPL and returns
 * the transaction result. If the transaction is successful, the function updates the transaction result object with a
 * success message and returns it. If the transaction fails, it prints the transaction result if verbose mode is
 * enabled, updates the transaction result object with a failure message, and returns it. In case of any errors during
 * the process, the function logs the error message.
 * 
 * @param {string} networkRPC - The network RPC URL to connect to the XRPL.
 * @param {object} account - The account object containing the address and secret of the account minting the NFT.
 * @param {string} uri - The URI of the NFT's metadata.
 * @param {object} nftOptions - An object containing various NFT options such as transferable, transferFee,
 * onlyXRP, burnable, tokenTaxon, authorizedMinting, and minter.
 * @param {object} txOptions - An object containing transaction options such as verbose and txMessage.
 * @returns {Promise<Object>} - An object containing the transaction result, success or failure message, and other
 * transaction details.
 * @throws {string} - An error message if there is a problem during the NFT minting process.
 */
export const mintNFToken = async(networkRPC,account,uri,nftOptions,txOptions)=>{
        try{
            let {verbose} = txOptions
            let {transferable,transferFee,onlyXRP,burnable,tokenTaxon,authorizedMinting,minter} = nftOptions
            let flags = 0;
            if (transferable===true) flags+=8;
            if (onlyXRP===true) flags+=2;
            if (burnable===true) flags+=1;

            let tx = {
                "TransactionType":"NFTokenMint",
                "Account":account.address,
                "NFTokenTaxon":tokenTaxon,
                "TransferFee":transferFee,
                "Flags":flags,
                "URI":xrpl.convertStringToHex(uri)
            }
            if(authorizedMinting) tx.Issuer = minter
            txOptions.txMessage = `Minting an NFT with the URI: ${uri}`

            let txResult = await transactionHandler(networkRPC,tx,account,txOptions)
            if(txResult.result === 'success') 
            {
                txResult.message = `Successfully minted an NFT`
                return txResult
            }
            else 
            {
                if(txOptions.verbose)  printResponse(txResult)
                txResult.message =`Failed to mint an NFT.` 
                return txResult
            }

        }
        catch(err)
        {
            console.log(`There was a problem minting the NFT:`,err)
        }
}