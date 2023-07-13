
import { importantMessage,warningMessage,pressAnyKey,encrypt,askQuestion,askYesNo ,decrypt,errorMessage} from "../index.js"

 /**
 * @function handleSeedEncryptionDecryption
 * @description
 * This function handles the encryption or decryption of a secret based on user input. It prompts the user
 * to decide whether they want to encrypt or decrypt the secret, and then asks for a password and a pin to perform the
 * operation. If the user chooses to encrypt the secret, the function returns an object containing the encrypted secret
 * and a flag indicating that the secret is encrypted. If the user chooses to decrypt the secret, the function returns
 * an object containing the decrypted secret and a flag indicating that the secret is decrypted.
 * 
 * @param {string} secret - The secret to be encrypted or decrypted.
 * @param {boolean} decryptIt - A flag indicating whether the secret should be decrypted (true) or encrypted (false).
 * @returns {Promise<Object>} - A promise that resolves to an object containing the encrypted or decrypted
 * secret and a flag indicating whether the secret is encrypted or decrypted.
 * @throws {Error} - Throws an error if there is a problem handling seed encryption/decryption.
 */
export const handleSeedEncryptionDecryption = async (secret,decryptIt) =>{
    try{
        let encryptSecret = await askYesNo(`Would you like to ${decryptIt?`decrypt`:`encrypt`} your secret?`) //await askQuestion({type:'confirm',message:'Would you like to encrypt your seed phrase?'})
        if(encryptSecret)
        {
            const regex = /^(?=.*[a-zA-Z])[a-zA-Z0-9!@#$%^&*()\-_=+{}[\]|;:'",.<>/?`~]/;
             let password = await askQuestion({
                type:'input',
                message:`Please provide a password to ${decryptIt?`decrypt`:`encrypt`} your secret:`,
                validate: (value) => {
                    if (value.length < 8) {
                        return 'Password must be at least 8 characters long.';
                    }
                    else if(value.includes(' ')){
                        return 'Password cannot contain spaces.'
                    }
                    else if(!regex.test(value))
                    {
                        return 'Password must contain at least one letter.'
                    }
                    else return true;
                }
             })

             let pin = await askQuestion({
                type:'input',
                message:`Please provide a pin to ${decryptIt?`decrypt`:`encrypt`} your secret:`,
                validate: (value) => {
                    if(Number(value) && value.length>3 && value.length<7)
                    {
                        return true;
                    }
                    else{
                        return 'Please enter a 4 to 6 digit pin:'
                    }
                }

             })

             if(!decryptIt)
             {
                importantMessage("STORE THIS IN A SAFE PLACE OR YOU MAY NOT BE ABLE TO REGAIN ACCESS TO YOUR DATA")
                warningMessage(`SECRET:${secret}`)
                warningMessage(`PASSWORD:${password}`)
                warningMessage(`PIN:${pin}`)
                await pressAnyKey()
                errorMessage(`These will not be shown again and there is no way to recover them!`)
                errorMessage(`ARE YOU SURE YOU STORED THESE IN A SAFE PLACE!`)
                await pressAnyKey()
                let encrypted= await encrypt(secret,password,pin) 
                let encryptedResponse = {seed:encrypted,seedEncrypted:true}
                return encryptedResponse
            }
            else
            {
                let decrypted = await decrypt(secret,password,pin)
                return {seed:decrypted,seedEncrypted:decryptIt?true:false}
                // let testEncrypted = await encrypt(decrypted,password,pin)
                // let testEncrypted2 = await encrypt(decrypted,password,pin)

                // console.log('Secret:',secret)
                // console.log('Decrypted:',decrypted)
                // console.log('Test Encrypted:',testEncrypted)
                // console.log('Test Encrypted2:',testEncrypted2)

                // if(testEncrypted !== secret)
                // {
                //     warningMessage(`It looks like you entered the wrong password or pin.`)
                //     if(await askYesNo(`Would you like to try again?`,true)) return await handleSeedEncryptionDecryption(secret,decryptIt)
                //     else
                // }
                // else  return {seed:decrypted,seedEncrypted:true}
            }
        }
        else
        {
            let declinedResponse = {seed:secret,seedEncrypted:decryptIt?true:false}
            return declinedResponse
        }
    }
    catch(err)
    {
        console.log(`There was a problem handling seed encryption/decryption`)
    }
}