import xrpl from 'xrpl'
import { askPassword, askPin, askYesNo, decrypt, errorMessage } from '../../utils/index.js'

/**
 * @function getWalletFromEncryptedSeed
 * @description
 * This function retrieves a wallet object from an encrypted seed by decrypting the seed using the user's
 * password and pin. It checks if the decrypted seed is a valid XRPL seed and if the wallet's classic address matches
 * the expected address. If the address does not match or the seed is invalid, the user is prompted to try again or exit
 * the process.
 * 
 * @param {string} expectedAddress - The expected classic address of the wallet to be retrieved.
 * @param {string} encryptedSeed - The encrypted seed used to generate the wallet.
 * @returns {Promise<Wallet|boolean>} - Returns the wallet object if the decryption is successful and the classic
 * address matches the expected address, or false if the user decides not to try again.
 * @throws {Error} - Throws an error if there is a problem handling the wallet retrieval from the encrypted seed.
 */
export const getWalletFromEncryptedSeed = async(expectedAddress,encryptedSeed) => {
        try
        {
            let password = await askPassword(expectedAddress)
            let pin = await askPin(expectedAddress)
            let decryptedSeed = await decrypt(encryptedSeed,password,pin)
            if(xrpl.isValidSecret(decryptedSeed))
            {
                let wallet = xrpl.Wallet.fromSeed(decryptedSeed)
                if(wallet.classicAddress === expectedAddress)
                {
                    return wallet
                }
                else{
                    console.log(`The address of the wallet generated from decrypted seed does not match the expected address.`)
                    if(await askYesNo(`Do you want to try again?`,true)) return await getWalletFromEncryptedSeed(expectedAddress,encryptedSeed)
                    else return false
                }
            }
            else
            {
                errorMessage(`The decrypted seed is not a valid XRPL seed.`)
                if(await askYesNo(`Do you want to try again?`,true)) return await getWalletFromEncryptedSeed(expectedAddress,encryptedSeed)
                else return false
            }
        }
        catch(err)
        {
            console.log(`There was a problem handling getting the wallet from an encrypted seed:`,err)
        }

}