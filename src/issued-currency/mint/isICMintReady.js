import { printBanner,infoMessage,warningMessage,printResponse } from "../../utils/index.js"
import { checkAccountExists,modifyAccountSettings,isSettingEnabled, getSpecificTrustline,setTrustline, } from "../../xrpl/index.js"

 /**
 * @function isICMintReady
 * @description
 * This function checks if the Issued Currency (IC) is ready for minting by verifying the existence of
 * issuer and treasury accounts, enabling default rippling on the issuer account, and setting up the trustline between
 * the issuer and treasury accounts. It returns a boolean value indicating whether the IC is mint-ready or not.
 * 
 * @param {string} network - The network to be used (e.g., 'mainnet', 'testnet').
 * @param {string} networkRPC - The RPC URL of the network.
 * @param {object} issuer - The issuer account object containing the address and secret.
 * @param {object} treasury - The treasury account object containing the address and secret.
 * @param {string} currencyHex - The currency code in hexadecimal format.
 * @returns {Promise<boolean>} - Returns true if the IC is mint-ready, otherwise false.
 * @throws {Error} - Throws an error if there is a problem checking if the IC is mint ready.
 */
export const isICMintReady = async(network,networkRPC,issuer,treasury,currencyHex )=>{
        try{

            let txOptions = {verify:true,verbose:true,txMessage:null,askConfirmation:true}
            let issuerChecked,defaultRipplingEnabled,treasuryChecked,trustlineExists = false
            let issuerReady,treasuryReady = false
            printBanner()
            infoMessage(`Checking if the IC is mint ready...`)
            console.log()


            infoMessage(`Checking if the issuer account exists on the network...`)
            issuerChecked = await checkAccountExists(network,networkRPC,issuer.address)
            printResponse(issuerChecked)
            console.log()

           if(issuerChecked.result==='success')
           {
                infoMessage(`Checking if default rippling is enabled on the issuer account...`)
                defaultRipplingEnabled = await isSettingEnabled(networkRPC,issuer.address,'lsfDefaultRipple')
                if(defaultRipplingEnabled.isEnabled===true) issuerReady=true
                printResponse(defaultRipplingEnabled)
                console.log()
                if(defaultRipplingEnabled.isEnabled ===false)
                {
                    let accountSetOptions = {defaultRipple:true}
                    defaultRipplingEnabled = await modifyAccountSettings(networkRPC,issuer,accountSetOptions,txOptions)
                    printResponse(defaultRipplingEnabled)
                    if(defaultRipplingEnabled.result==='success') issuerReady=true
                    console.log()
                }
            
            
                infoMessage(`Checking if the treasury account exists on the network...`)
                treasuryChecked = await checkAccountExists(network,networkRPC,treasury.address)
                printResponse(treasuryChecked)
                console.log()


                if(treasuryChecked.result==='success')
                {
                    infoMessage(`Checking if the trustline is ready...`)
                    trustlineExists = await getSpecificTrustline(networkRPC,currencyHex,issuer.address,treasury.address)
                    if(trustlineExists.result==='success') treasuryReady=true
                    printResponse(trustlineExists)
                    console.log()
                    if(trustlineExists.result==='warn')
                    {
                        trustlineExists = await setTrustline(networkRPC,issuer.address,currencyHex,treasury,{},txOptions)
                        if(trustlineExists.result==='success') treasuryReady=true
                        printResponse(trustlineExists)
                        console.log()
                    }
                }
            }

            if(issuerReady && treasuryReady) return true
            else
            {
                warningMessage(`Some of the prerequisites for minting the IC are not met.`)
                infoMessage(`Issuer account exists: ${issuerChecked?.result==='success'?true:false}`)
                infoMessage(`Default rippling enabled: ${defaultRipplingEnabled?.result==='success'?true:false}`)
                infoMessage(`Treasury account exists: ${treasuryChecked?.result==='success'?true:false}`)
                infoMessage(`Treasury Trustline: ${trustlineExists?.result==='success'?true:false}`)
                return false
            }

        }
        catch(err)
        {
            console.log('There was a problem checking if the IC is mint ready:',err)
        }
}
