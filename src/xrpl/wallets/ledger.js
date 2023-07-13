import { createRequire } from 'module'
const require = createRequire(import.meta.url)
const TransportNodeHid = require("@ledgerhq/hw-transport-node-hid").default;
const Xrp = require("@ledgerhq/hw-app-xrp").default;
import { hashes,encode,decode} from 'xrpl';
import {askWhichFromList,createSpinner,errorMessage,infoMessage,pressAnyKey,printBanner,warningMessage} from '../../utils/index.js'

 /**
 * @function signTxWithLedger
 * @description
 * Signs a transaction using a Ledger hardware wallet. The function takes an account and a transaction,
 * encodes the transaction, and signs it using the Ledger device. It then returns an object containing the signed
 * transaction, its hash, and a success message.
 * 
 * @param {Object} account - The account object containing the public key and path.
 * @param {Object} transaction - The transaction object to be signed.
 * @returns {Promise<Object>} - An object containing the result, message, signed transaction blob, and hash of the
 * signed transaction.
 * @throws Error if there is a problem signing the transaction with the Ledger device.
 */
export const signTxWithLedger = async(account,transaction)=>{
    let spinner = await createSpinner(`Waiting for you to sign the transaction with your ledger device...`)
    try
    {
        let baseFlag= 2147483648
        let transport = await TransportNodeHid.create(20000,"XRP");
        let xrpTransport = new Xrp(transport)
        transaction.SigningPubKey = account.publicKey
        transaction.Flags = baseFlag+transaction.Flags
        let encodedTx= encode(transaction)
        let signedTx = await xrpTransport.signTransaction(account.path,encodedTx)
        transaction.TxnSignature = signedTx.toUpperCase()
        let tx_blob= encode(transaction)
        let hash = hashes.hashSignedTx(transaction)
        spinner.stop()
        return {result:'success',message:'Transaction successfully signed',tx_blob:tx_blob,hash:hash}
    }
    catch(err)
    {
        spinner.stop()
        if(err.statusCode)
        {
            switch(err.statusCode)
            {
                case 27404:
                    errorMessage(`Failed to make contact with the device...`)
                    warningMessage('Please unlock and open the XRP app on your ledger device before continuing..')
                    await pressAnyKey()
                    return await signTxWithLedger(account,transaction)
                    break;
                case 27013:
                    return {result:'warn', message:`You rejected the transaction on your ledger device.`}
                    break;
                default:
                    warningMessage(`Ledger nano does not support this transaction type.`)
                    return {result:'warn',message:`Attempted to sign an unsupported transaction type.`}
            }
        }
        else
        {
            console.log(err);
            errorMessage(`Is your device connected??`)
            return {result:'warn',message:`There was a problem signing the transaction with the ledger device.`}
        }
    }
}

/**
 * @function selectWalletFromLedgerDevice
 * @description
 * Retrieves a list of available addresses from a Ledger hardware wallet and prompts the user to select
 * one. The function iterates through the addresses, retrieves their public keys, and stores them in an array. The user
 * is then prompted to select an address from the list. The function returns an object containing the selected wallet's
 * path, address, and public key.
 * 
 * @returns {Promise<Object>} - An object containing the result, message, path, address, and public key of the selected wallet.
 * @throws Error if there is a problem selecting a wallet from the Ledger device.
 */
export const selectWalletFromLedgerDevice = async()=>{
    printBanner()
    let addressCount=0;
    infoMessage(`Please connect your device and open the XRP app before continuing...`)
    await pressAnyKey()
    let spinner = await createSpinner(`Attempting to make contact with the ledger device...`)
    try
    {
        const transport= await TransportNodeHid.create(20000);
        spinner.message(`Getting 10 available addresses from ledger device... ${addressCount} found.`)
        const xrpTransport = new Xrp(transport)
        let addressesPaths= []
        for(let i = 0; i < 2**32;i++)
        {
            addressCount++;
            let path = `44'/144'/0'/0/${i}`;
            let {address,publicKey} = await xrpTransport.getAddress(path);
            let pubUpper = publicKey.toUpperCase()
            let addrPath = {path,address,publicKey:pubUpper}
            addressesPaths.push(addrPath)
            spinner.message(`Getting 10 available addresses from ledger device... ${addressCount} found.`)
            if(i!==0 && i %10 ===0)
            {
                spinner.stop()
                let addresses = addressesPaths.map((addrPath)=>addrPath.address)
                addresses.push('View next 10 addresses')
                let selectedWallet = await askWhichFromList(`Please select an address found on your ledger device:`,addresses);
                if(selectedWallet === 'View next 10 addresses') 
                {
                    addressesPaths=[]
                    spinner.start(`Getting available addresses from ledger device... ${addressCount} found.`)
                }
                else
                {
                    spinner.stop();
                    let {path,address,publicKey} = addressesPaths.find((addrPath)=>addrPath.address===selectedWallet)
                    return {result:'success',message:'Successfully selected a wallet from the ledger device.',path,address,publicKey}
                }
            }
        }
    }
    catch(err)
    {
        spinner.stop()
        if(err.statusCode == 27404)
        {
            errorMessage(`Failed to make contact with the device...`)
            warningMessage('Please unlock and open the XRP app on your ledger device before continuing..')
            await pressAnyKey()
            return await selectWalletFromLedgerDevice()
        }
        else
        {
            errorMessage(`Please be sure your device is connected and the XRP app is open.`)
            return {result:'error',message:`There was a problem selecting a wallet from the ledger device.`}
        }
    }
}