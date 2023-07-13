import {configHandler} from '../configHandler.js'

/**
 * @function getAccountsAndNetworkRelatedToConfig
 * @description
 * Retrieves the accounts and network information related to the current configuration. The function first
 * gets the current configuration, then based on the configuration type (NFT, IC, or default), it extracts the relevant
 * accounts and network information. It also handles NFT distributions and adds the distribution payment accounts if
 * they exist. Finally, it returns an object containing the accounts, networkRPC, and network information.
 * 
 * @param {string} type - The type of configuration (NFT, IC, or default).
 * @returns {GetAccountsAndNetworkRelatedToConfigResult} - An object containing the result, a message, and 
 * (if successful) the accounts and network information related to a config.
 * @throws {Error} - If there is a problem getting the accounts related to the current config.
 */
export const getAccountsAndNetworkRelatedToConfig = async(type)=>{
    try
    {
        let currentConfig = await configHandler.getConfigs();
        type = currentConfig.config_type
        let accounts=[]
        let networkRPC
        let network
        switch(type)
        {
            case 'NFT':
                {
                    let minter = {name:'Minter',...currentConfig.NFT.minter}
                    accounts.push(minter)
                    networkRPC = currentConfig.NFT.networkRPC
                    network=currentConfig.NFT.network
                    if(currentConfig.NFT.authorizedMinting)
                    {
                        let authorizedMinter = {name:'Authorized Minter',...currentConfig.NFT.authorizedMinter}
                        accounts.push(authorizedMinter)
                    }
                    let NFTDistributions = await configHandler.getConfigs('NFT_DISTRIBUTION')
                     let names = Object.keys(NFTDistributions)
                    names.forEach(name=>{
                        if(NFTDistributions[name].projectName === currentConfig.NFT.name)
                        {
                            if(NFTDistributions[name].paymentAccount!==null)
                            {
                                let distributionAccount = {name:`'${NFTDistributions[name].name}' Distribution Payment Account`,...NFTDistributions[name].paymentAccount}
                                accounts.push(distributionAccount)
                            }
                        }
                    })
                   
                    break;
                }
            case 'IC':
                {
                    networkRPC = currentConfig.IC.networkRPC
                    network=currentConfig.IC.network

                    let issuer = {name:'Issuer',...currentConfig.IC.issuer}
                    accounts.push(issuer)
                    let treasury = {name:'Treasury', ...currentConfig.IC.treasury}
                    accounts.push(treasury)
                    let operational = {name:'Operational', ...currentConfig.IC.operational}
                    accounts.push(operational)
                    break;
                }
            default:
                {
                    networkRPC=currentConfig.XTOKENIZE_SETTINGS.networkRPC
                    network=currentConfig.XTOKENIZE_SETTINGS.network
                    if(currentConfig.XTOKENIZE_SETTINGS.funding_account!==null){
                        let fundingAccount = {name:'Funding Account',...currentConfig.XTOKENIZE_SETTINGS.funding_account}
                        accounts.push(fundingAccount)
                    }
                    if(currentConfig.XTOKENIZE_SETTINGS.accounts.length>0)
                    {
                        accounts.push(...currentConfig.XTOKENIZE_SETTINGS.accounts)
                    }
                    break;
                }
        }
        if(accounts.length===0) return {result:'warn',message:`There are no accounts configured. Please configure one in the settings first.`}
        else if(networkRPC===null) return {result:'warn',message:`There is no network RPC related to the current config.`}
        else return{result:'success',accounts:accounts,networkRPC:networkRPC,network:network}
        
    }
    catch(err)
    {
        console.log('There was a problem getting the accounts related to the current config: ',err)
    }
}