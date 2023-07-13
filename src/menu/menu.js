import  {configHandler,}  from '../config/configHandler.js'
import { manageSettings } from '../config/misc/manageSettings.js'
import {mintIC,burnIC,manageIndividualFreeze,toggleGlobalFreeze,enableNoFreeze,runICDistribution,verifyICDistribution, dex,viewICDistributionData,} from '../issued-currency/index.js'
import { accountSettingsModifier,sendPayment,createTestWallets,fundTestWallets,setTestTrustlines,fundAnAccount,createMockMetadataAndAssets,createMockMetadataDeployment,getNFTokenHistory,purchaseSimpleDistributionNFTs,sendOnDemandPaymentsToDistribution,claimOnDemandNFTsFromDistribution,} from '../tools/index.js'
import { runMetadataDeployment,runNFTokenMint,verifyNFTokenMint,runNFTokenDistribution,getNFTokenDistributionData,marketplace} from '../nfts/index.js'


 const placeHolderFunction = async(handlerName)=>{
    console.log('Place Holder Function for: ',handlerName)
    return {result:'success',message:'Success acting as a placeholder for a function!'}
}

 /**
 * @object menu
 * @description
 * The menu object contains the structure and handlers for the command line application's menu system. It
 * is organized into several sub-menus, each representing a specific functionality or feature of the application. The
 * menu system allows users to navigate through the application and perform various tasks related to Issued Currencies,
 * NFTs, Tools, and Settings.
 *
 * @property {Object} Main - The main menu of the application.
 * @property {Object} IssuedCurrencyConfigs - The menu for managing Issued Currency configurations.
 * @property {Object} IssuedCurrencyMainMenu - The main menu for managing Issued Currencies.
 * @property {Object} IssuedCurrencyFreezeMenu - The menu for managing Issued Currency freeze settings.
 * @property {Object} IssuedCurrencyDistributionMenu - The menu for managing Issued Currency distributions.
 * @property {Object} IssuedCurrencyManageExistingDistribution - The menu for managing existing Issued Currency distributions.
 * @property {Object} IssuedCurrencyDataMenu - The menu for viewing Issued Currency data.
 * @property {Object} IssuedCurrencyToolsMenu - The menu for accessing Issued Currency tools.
 * @property {Object} NFTConfigs - The menu for managing NFT configurations.
 * @property {Object} NFTMainMenu - The main menu for managing NFTs.
 * @property {Object} NFTMetadataMenu - The menu for managing NFT metadata.
 * @property {Object} NFTManageExistingMetadataDeployment - The menu for managing existing NFT metadata deployments.
 * @property {Object} NFTMintMenu - The menu for managing NFT minting.
 * @property {Object} NFTManageExistingMint - The menu for managing existing NFT mints.
 * @property {Object} NFTDistributionMenu - The menu for managing NFT distributions.
 * @property {Object} NFTManageExistingDistribution - The menu for managing existing NFT distributions.
 * @property {Object} NFTDataMenu - The menu for viewing NFT data.
 * @property {Object} NFTToolsMenu - The menu for accessing NFT tools.
 * @property {Object} ToolsMainMenu - The main menu for accessing various tools.
 */
export const menu = {
    //MAIN MENU 
    Main:
    {
        id:'main',
        message:'What would you like to do?',
        handlers:{
            "Issued Currencies":{type:'menu',menu:'IssuedCurrencyConfigs'},
            "NFTs":{type:'menu',menu:'NFTConfigs'},
            "Tools":{type:'menu',menu:'ToolsMainMenu'},
            "DEX":{type:'function',func:()=>dex(),next:'Main'},
            "NFT Marketplace":{type:'function',func:()=>marketplace(),next:'Main'},
            "Settings":{type:'function',func:()=>manageSettings(),next:'exit'},
            "Exit":{type:'function',func:()=>process.exit(0)}
        }
    },
    // ISSUED CURRENCY MENUS
    IssuedCurrencyConfigs:
    {
        id:'configs',
        message:'What would you like to do?',
        handlers:{
            "Create Issued Currency Config":{type:'function',func:()=>configHandler.createNewConfig('IC'),next:'IssuedCurrencyMainMenu',warn:'IssuedCurrencyConfigs'},
            "Manage Existing Issued Currency Config":{type:'function',func:()=>configHandler.selectConfig('IC'),next:'IssuedCurrencyMainMenu',warn:'IssuedCurrencyConfigs'},
            "Go Back":{type:'menu',menu:'Main'}
        }
    },
    IssuedCurrencyMainMenu:
    {
        id:'ic-main',
        message:'How would you like to manage your Issued Currency?',
        handlers:{
            "Mint":{type:'function',func:()=>mintIC(),next:'IssuedCurrencyMainMenu'},
            "Burn":{type:'function',func:()=>burnIC(),next:'IssuedCurrencyMainMenu'},
            "Freeze":{type:'menu',menu:'IssuedCurrencyFreezeMenu'},
            "Distribute":{type:'menu',menu:'IssuedCurrencyDistributionMenu'},
            "DEX":{type:'function',func:()=>dex(),next:'IssuedCurrencyMainMenu'},
            // "Data":{type:'menu',menu:'IssuedCurrencyDataMenu'},
            "Tools":{type:'menu',menu:'IssuedCurrencyToolsMenu'},
            "Go back":{type:'menu',menu:'IssuedCurrencyConfigs'}
        }
    },
    IssuedCurrencyFreezeMenu:
    {
        id:'ic-freeze',
        message:'How would you like to manage your Issued Currency?',
        handlers:{
            "Manage Individual Freeze":{type:'function',func:()=>manageIndividualFreeze(),next:'IssuedCurrencyFreezeMenu'},
            "Toggle Global Freeze":{type:'function',func:()=>toggleGlobalFreeze(),next:'IssuedCurrencyFreezeMenu'},
            "Disable Freezing":{type:'function',func:()=>enableNoFreeze(),next:'IssuedCurrencyFreezeMenu'},
            "Go Back":{type:'menu',menu:'IssuedCurrencyMainMenu'}
        }
    },
    IssuedCurrencyDistributionMenu:{
        id:'ic-distribution',
        message:'How would you like to manage your Issued Currency?',
        handlers:{
            "Create Distribution":{type:'function',func:()=>configHandler.createNewConfig(`IC_DISTRIBUTION`),next:'IssuedCurrencyDistributionMenu',warn:'IssuedCurrencyDistributionMenu'},
            "Manage Distribution":{type:'function',func:()=>configHandler.selectConfig('IC_DISTRIBUTION'),next:'IssuedCurrencyManageExistingDistribution',warn:'IssuedCurrencyDistributionMenu'},
            "Distribution History":{type:'function',func:()=>viewICDistributionData(true),next:'IssuedCurrencyDistributionMenu'},
            "Go Back":{type:'menu',menu:'IssuedCurrencyMainMenu'},
        }
    },
    IssuedCurrencyManageExistingDistribution:{
        id:'ic-manage-existing-distribution',
        message:'How would you like to manage this distribution?',
        handlers:{
            "Run Distribution":{type:'function',func:()=>runICDistribution(),next:'IssuedCurrencyManageExistingDistribution'},
            "Verify Distribution":{type:'function',func:()=>verifyICDistribution(),next:'IssuedCurrencyManageExistingDistribution'},
            "View Distribution Data":{type:'function',func:()=>viewICDistributionData(),next:'IssuedCurrencyManageExistingDistribution'},
            "Go Back":{type:'menu',menu:'IssuedCurrencyDistributionMenu'}
        }
    },
    IssuedCurrencyDataMenu:{
        id:'ic-data',
        message:'How would you like to manage your Issued Currency?',
        handlers:{
            "View Balances":{type:'function',func:()=>placeHolderFunction("View Balances"),next:'IssuedCurrencyDataMenu'},
            "View Transactions":{type:'function',func:()=>placeHolderFunction("View Transactions"),next:'IssuedCurrencyDataMenu'},
            "View Trustlines":{type:'function',func:()=>placeHolderFunction("View Trustlines"),next:'IssuedCurrencyDataMenu'},
            "Go Back":{type:'menu',menu:'IssuedCurrencyMainMenu'}
        }
    },
    IssuedCurrencyToolsMenu:{
        id:'ic-tools',
        message:'How would you like to manage your Issued Currency?',
        handlers:{
            "Manage Project Account Settings":{type:'function',func:()=>accountSettingsModifier('IC'),next:'IssuedCurrencyToolsMenu'},
            "Send Payment":{type:'function',func:()=>sendPayment('IC'),next:'IssuedCurrencyToolsMenu'},
            // "Create An Offer For an NFT":{type:'function',func:()=>createAnOfferForAnNFT(),next:'IssuedCurrencyToolsMenu'},
            "Create Test Wallets":{type:'function',func:()=>createTestWallets(),next:'IssuedCurrencyToolsMenu'},
            "Fund Test Wallets":{type:'function',func:()=>fundTestWallets(),next:'IssuedCurrencyToolsMenu'},
            "Set Test Trustlines":{type:'function',func:()=>setTestTrustlines(),next:'IssuedCurrencyToolsMenu'},
            "Go Back":{type:'menu',menu:'IssuedCurrencyMainMenu'}
        }
    },
    // NFT MENUS 
    NFTConfigs:{
        id:'configs',
        message:'What would you like to do?',
        handlers:{
            "Create NFT Config":{type:'function',func:()=>configHandler.createNewConfig('NFT'),next:'NFTMainMenu',warn:'NFTConfigs'},
            "Manage Existing NFT Config":{type:'function',func:()=>configHandler.selectConfig('NFT'),next:'NFTMainMenu',warn:'NFTConfigs'},
            "Go Back":{type:'menu',menu:'Main'}
        }
    },
    NFTMainMenu:{
        id:'nft-main',
        message:'How would you like to manage your NFT?',
        handlers:{
            "Metadata":{type:'menu',menu:'NFTMetadataMenu'},
            "Mint":{type:'menu',menu:'NFTMintMenu'},
            "Distribution":{type:'menu',menu:'NFTDistributionMenu'},
            // "Data":{type:'menu',menu:'NFTDataMenu'},
            "Tools":{type:'menu',menu:'NFTToolsMenu'},
            "Go Back":{type:'menu',menu:'NFTConfigs'}
        }
    },
    NFTMetadataMenu:{
        id:'nft-metadata',
        message:'What would you like to do?',
        handlers:{
            "Create Metadata Deployment":{type:'function',func:()=>configHandler.createNewConfig('NFT_METADATA'),next:'NFTManageExistingMetadataDeployment',warn:'NFTMetadataMenu'},
            "Manage Existing Deployment":{type:'function',func:()=>configHandler.selectConfig('NFT_METADATA'),next:'NFTManageExistingMetadataDeployment',warn:'NFTMetadataMenu'},
            "Go Back":{type:'menu',menu:'NFTMainMenu'}
        }
    },
    NFTManageExistingMetadataDeployment:{
        id:'nft-manage-existing-metadata-deployment',
        message:'What would you like to do?',
        handlers:{
            "Deploy Metadata":{type:'function',func:()=>runMetadataDeployment(),next:'NFTManageExistingMetadataDeployment'},
            "Verify Metadata":{type:'function',func:()=>placeHolderFunction("Verify Metadata"),next:'NFTManageExistingMetadataDeployment'},
            "Go Back":{type:'menu',menu:'NFTMetadataMenu'}
        }
    },
    NFTMintMenu:{
        id:'nft-mint',
        message:'What would you like to do?',
        handlers:{
            "Create New Mint Config":{type:'function',func:()=>configHandler.createNewConfig('NFT_MINT'),next:'NFTManageExistingMint',warn:'NFTMintMenu'},
            "Manage Existing Mint Config":{type:'function',func:()=>configHandler.selectConfig('NFT_MINT'),next:'NFTManageExistingMint',warn:'NFTMintMenu'},
            "Go Back":{type:'menu',menu:'NFTMainMenu'}
        }
    },
    NFTManageExistingMint:{
        id:'nft-manage-existing-mint',
        message:'What would you like to do?',
        handlers:{
            "Mint NFTs":{type:'function',func:()=>runNFTokenMint(),next:'NFTManageExistingMint'},
            "Verify Mint":{type:'function',func:()=>verifyNFTokenMint(),next:'NFTManageExistingMint'},
            "Go Back":{type:'menu',menu:'NFTMintMenu'}
        }
    },
    NFTDistributionMenu:{
        id:'nft-distribution',
        message:'What would you like to do?',
        handlers:{
            "Create New Distribution":{type:'function',func:()=>configHandler.createNewConfig(`NFT_DISTRIBUTION`),next:'NFTDistributionMenu'},
            "Manage Existing Distribution":{type:'function',func:()=>configHandler.selectConfig('NFT_DISTRIBUTION'),next:'NFTManageExistingDistribution',warn:'NFTDistributionMenu'},
            "Go Back":{type:'menu',menu:'NFTMainMenu'}
        }
    },
    NFTManageExistingDistribution:{
        id:'nft-manage-existing-distribution',
        message:'What would you like to do?',
        handlers:{
            "Run Distribution":{type:'function',func:()=>runNFTokenDistribution(),next:'NFTManageExistingDistribution'},
            "View Distribution Data":{type:'function',func:()=>getNFTokenDistributionData(),next:'NFTManageExistingDistribution'},
            "Go Back":{type:'menu',menu:'NFTDistributionMenu'}
        }
    },
    NFTDataMenu:{
        id:'nft-data',
        message:'What would you like to do?',
        handlers:{
            "View NFT Data":{type:'function',func:()=>placeHolderFunction('View NFT Data'),next:'NFTDataMenu'},
            "Go Back":{type:'menu',menu:'NFTMainMenu'}
        }
    },
    NFTToolsMenu:{
        id:'nft-tools',
        message:'What would you like to do?',
       
        handlers:{
            "Manage Project Account Settings":{type:'function',func:()=>accountSettingsModifier('NFT'),next:'NFTToolsMenu'},
            "Send Payment":{type:'function',func:()=>sendPayment('NFT'),next:'NFTToolsMenu'},
            // "Create An Offer For an NFT":{type:'function',func:()=>createAnOfferForAnNFT(),next:'NFTToolsMenu'},
            "Create Mock Metadata and Assets":{type:'function',func:()=>createMockMetadataAndAssets(),next:'NFTToolsMenu'},
            "Create Mock Metadata Deployment":{type:'function',func:()=>createMockMetadataDeployment(),next:'NFTToolsMenu'},
            "Purchase Simple distribution NFTs":{type:'function',func:()=>purchaseSimpleDistributionNFTs(),next:'NFTToolsMenu'},
            "Send On-Demand Payments (On-Demand Distribution)":{type:'function',func:()=>sendOnDemandPaymentsToDistribution(),next:'NFTToolsMenu'},
            "Claim On-Demand NFTs":{type:'function',func:()=>claimOnDemandNFTsFromDistribution(),next:'NFTToolsMenu'},
            "Go Back":{type:'menu',menu:'NFTMainMenu'}
        }
    },
    //TOOL MENUS
    ToolsMainMenu:{
        id:'tools-main',
        message:'What would you like to do?',
        handlers:{
            "Create testnet wallets":{type:'function',func:()=>createTestWallets(),next:'ToolsMainMenu'},
            "Fund testnet wallets":{type:'function',func:()=>fundTestWallets(),next:'ToolsMainMenu'},
            "Fund an Account":{type:'function',func:()=>fundAnAccount(),next:'ToolsMainMenu'},
            "Send Payment":{type:'function',func:()=>sendPayment('XTOKENIZE_SETTINGS'),next:'ToolsMainMenu'},
            "Account Settings Modifier": {type:'function',func:()=>accountSettingsModifier("SETTINGS"),next:'ToolsMainMenu'},
            "Go Back":{type:'menu',menu:'Main'}
        }
    },
}