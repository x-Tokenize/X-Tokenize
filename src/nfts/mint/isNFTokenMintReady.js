import {printBanner,infoMessage,successMessage,warningMessage,printResponse,askYesNo} from '../../utils/index.js'
import {checkAccountExists,modifyAccountSettings,getXrpBalance} from '../../xrpl/index.js'

 /**
 * @function isNFTokenMintReady
 * @description
 * This function checks if the minting process is ready to proceed by verifying the existence of the
 * minting account, the authorized minting account (if applicable), and ensuring that the metadata is ready and reserve
 * requirements are met. It also provides the option to enable authorized minting on the minting account if it is not
 * already enabled.
 * 
 * @param {string} network - The network to be used for the minting process.
 * @param {string} networkRPC - The RPC URL of the network.
 * @param {object} minter - The minter account object containing the address and secret.
 * @param {boolean} authorizedMinting - A flag indicating if authorized minting is enabled.
 * @param {object} authorizedMinter - The authorized minter account object containing the address and secret
 * (if applicable).
 * @param {Array} items - An array of item objects containing information about the items to be minted.
 * @returns {Promise<boolean>} - Returns true if all prerequisites for the minting process are met, otherwise returns false.
 * @throws {string} - Throws an error message if there is a problem checking if the mint is ready.
 */

export const isNFTokenMintReady=async(network,networkRPC,minter,authorizedMinting,authorizedMinter,items)=>{
        try{
            let txOptions = {verify:true,verbose:true,txMessage:null,askConfirmation:true}
            let minterChecked = false;
            let isAuthorizedMinting =authorizedMinting
            let authorizedMinterChecked = !isAuthorizedMinting?true:false;
            let authorizedMinterAuthorized = isAuthorizedMinting?false:true;
            let metadataReady = false;
            let reserveRequirementsMet = false;
            let accountToCheckReserve=authorizedMinting?authorizedMinter.address:minter.address

            printBanner()
            infoMessage(`Checking if the mint is ready...`)
            console.log()

            infoMessage(`Checking if the minting account exists...`)
            let minterExists = await checkAccountExists(network,networkRPC,minter.address)
            if(minterExists.result==='success') minterChecked = true;
            printResponse(minterExists)
            console.log()

            if(minterChecked && isAuthorizedMinting)
            {
                infoMessage(`Checking if the authorized minting account exists...`)
                let authorizedMinterExists = await checkAccountExists(network,networkRPC,authorizedMinter.address)
                if(authorizedMinterExists.result==='success') authorizedMinterChecked = true;
                printResponse(authorizedMinterExists)
                console.log()
            }

            if(minterChecked && isAuthorizedMinting && authorizedMinterChecked)
            {
                infoMessage(`Checking if the authorized minting account is authorized to mint...`)
                let NFTokenMinter = minterExists.account_data.NFTokenMinter
                if(NFTokenMinter && NFTokenMinter === authorizedMinter.address) {
                    successMessage(`The authorized minting account is authorized to mint.`)
                    authorizedMinterAuthorized = true;
                }
                else
                {
                    warningMessage(`It looks like the authorized minting account is not authorized to mint.`)
                    if(await askYesNo(`Would you like to enable authorized minting on the minting account?`,true))
                    {
                        let accountSetOptions={authorizedNFTokenMinter:true,additionalValues:{NFTokenMinter:authorizedMinter.address}}
                        let settingsResult = await modifyAccountSettings(networkRPC,minter,accountSetOptions,txOptions)
                        if(settingsResult.result==='success') authorizedMinterAuthorized = true;
                        else
                        {
                            warningMessage(`There was a problem enabling authorized minting on the minting account.`)
                            printResponse(settingsResult)
                            console.log()
                        }
                    }
                    else
                    {
                      warningMessage(`User declined enabling authorized minting on the minting account.`)
                      authorizedMinterAuthorized=false;  
                    }
                }
            }

            console.log()
            infoMessage(`Checking if metadata is ready...`)
            let missingURIs = items.filter(item=>item.uri==="")
            if(missingURIs.length===0){
                metadataReady = true;
                successMessage(`It looks like all items have URIs.`)
            } 
            else warningMessage(`It looks like there are ${missingURIs.length} items with missing URIs.`)
            console.log()


            infoMessage(`Checking if reserve requirements are met...`)
            let nonMintedItems = items.filter((item)=>item.status!=='minted');
            let estimatedReserve = nonMintedItems.length>32?(Math.floor((nonMintedItems.length/24))*2000000):2000000
            infoMessage(`Estimated reserve required: ${estimatedReserve} drops.`)
            let accountXRPBalance = await getXrpBalance(networkRPC,accountToCheckReserve,true)
            if(accountXRPBalance.result==='success')
            {
                let {balance,spendable,reserved} = accountXRPBalance
                warningMessage(`Account balance: ${balance} drops`)
                warningMessage(`Account spendable: ${spendable} drops`)
                warningMessage(`Account reserved: ${reserved} drops`)
                let reserveMet = (balance-reserved)>estimatedReserve
                if(reserveMet){
                    successMessage(`It looks like the reserve requirement will be met for this mint.`)
                    reserveRequirementsMet = true;
                }
                else warningMessage(`It looks like the reserve requirement will not be met for this mint.`)
            }
            console.log()

            if(minterChecked && authorizedMinterChecked && authorizedMinterAuthorized && metadataReady && reserveRequirementsMet) return true
            else{
                warningMessage(`Some of the prequisites for the mint are not met.`)
                infoMessage(`Minter checked: ${minterChecked}`)
                infoMessage(`Authorized minting checked: ${authorizedMinterChecked}`)
                infoMessage(`Authorized minting authorized: ${authorizedMinterAuthorized}`)
                infoMessage(`Metadata ready: ${metadataReady}`)
                infoMessage(`Reserve requirements met: ${reserveRequirementsMet}`)
                return false

            }
            

        }
        catch(err)
        {
            console.log("There was a problem checking if the mint is ready.")
        }

}