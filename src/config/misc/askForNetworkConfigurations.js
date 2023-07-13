import { printBanner,infoMessage,warningMessage,successMessage,askWhichFromList,pressAnyKey,askYesNo,askForTextInput } from "../../utils/index.js"
import { pingRPC } from "../../xrpl/index.js"

/**
 * @function askForNetworkConfigurations
 * @description
 * This function guides the user through a series of prompts to configure the network settings for the
 * XRPL mainnet, testnet, or altnet. It provides information about each network, advises the user to start with the
 * testnet, and warns against using mainnet wallets/addresses/currencies on testnet/altnet. The user can choose to use
 * default nodes or provide a custom RPC URL. The function then pings the chosen RPC server to ensure connectivity
 * before returning the network configurations.
 * 
 * @returns {NetworkConfigResult} - An object containing the result, message and (if succesful) the selected network and rpc endpoint to connect to.
 * @throws {Error} - If there is a problem getting the network configurations.
 */
export const askForNetworkConfigurations = async()=>{
    try
    {
        printBanner()
        infoMessage('The network you choose will determine if you will be able to use the config on the XRPL mainnet, testnet or altnet.')
        infoMessage('The mainnet is the production network and is used for real transactions. ')
        infoMessage('The testnet is a network used for testing and development purposes.')
        infoMessage('The altnet refers to alternative networks like the AMM testnet or the XRP Ledger Devnet.')
        warningMessage('It is strongly advised that you begin by using the testnet to familiarize yourself with the process before using the mainnet.')
        warningMessage('If you are using a testnet/altnet, do not use any of your mainnet wallets/addresses/currencies.')
        let network = await askWhichFromList('Which network would you like to use?',['mainnet','testnet','altnet','cancel'])
        if(network==='cancel') return {result:'warn',message:'No network selected'}
        else
        {
            let networkRPC = network==='mainnet' ? 'https://s2.ripple.com:51234' : 'https://s.altnet.rippletest.net:51234'
            let defaultNode
            if(network !=='altnet')
            {
                printBanner()
                infoMessage('The default nodes are connected to publicly available network infrastructure.')
                infoMessage('For the best performance, it is recommended that you use your own infrastructure and connect to your own nodes.')
                defaultNode = await askYesNo(`Use default nodes? (RPC: ${networkRPC})`)
            }
            if(!defaultNode)
            {
                printBanner()
                let customRPC = await askForTextInput('Enter the RPC url of the custom node:')
                networkRPC = customRPC
            }
            if(await pingRPC(networkRPC))
            {
                successMessage(`Successfully contacted the RPC server at ${networkRPC}`)
                await pressAnyKey()
                return{result:'success', message:'Network configurations set', network:network, rpc:networkRPC}
            }
            else
            {
                warningMessage(`Failed to contact the RPC server at ${networkRPC}. Reconfiguring the network settings....`)
                await pressAnyKey()
                return await askForNetworkConfigurations()
            }
        }
    }
    catch(err)
    {
        console.log('There was a problem getting the network configurations: ',err)
    }
}