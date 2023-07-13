
import {askWhichFromList,askForTextInput,pressAnyKey,errorMessage} from '../utils/index.js'
import {createIssuedCurrencyConfig, createIssuedCurrencyDistributionConfig} from './ic/index.js'
import { createNFTConfig,createMetadataConfig,createNFTMintConfig,createNFTDistributionConfig } from './nft/index.js'
import Conf from 'conf'

/**
 * @class ConfigHandler
 * @description
 * Handles the configuration for the X-Tokenize project. This class manages the configuration settings for
 * Issued Currency, NFT, and other related configurations. It also handles the storage and retrieval of these
 * configurations using the 'conf' package.
 */
class ConfigHandler{
    XTOKENIZE_SETTINGS = new Conf({projectName:'X-Tokenize',configName:'XTOKENIZE_SETTINGS'})
    IC = new Conf({projectName:'X-Tokenize',configName:'IC'})
    IC_DISTRIBUTION = new Conf({projectName:'X-Tokenize',configName:'IC_DISTRIBUTION'})
    NFT = new Conf({projectName:'X-Tokenize',configName:'NFT'})
    NFT_METADATA = new Conf({projectName:'X-Tokenize',configName:'NFT_METADATA'})
    NFT_MINT = new Conf({projectName:'X-Tokenize',configName:'NFT_MINT'})
    NFT_DISTRIBUTION = new Conf({projectName:'X-Tokenize',configName:'NFT_DISTRIBUTION'})
    TEST_WALLETS = new Conf({projectName:'X-Tokenize',configName:'TEST_WALLETS'})
    TRANSACTIONS = new Conf({projectName:'X-Tokenize',configName:'TRANSACTIONS'})
    CURRENT_CONFIG = new Conf({projectName:'X-Tokenize',configName:'CURRENT_CONFIG',watch:true})
    constructor(){
        this.initialized = this.initialize()  
    }

    /**
     * @method handleCurrentConfigChange
     * @description
     * Handles changes in the current configuration. When a change is detected, it updates the corresponding
     * configuration in the ConfigHandler instance.
     *
     * @param {object} newValue - The new configuration value.
     * @param {object} oldValue - The old configuration value.
     * @returns {Promise<void>}
     */
    handleCurrentConfigChange = async(newValue,oldValue)=>{
        let keys = Object.keys(newValue);
        for(let i = 0;i<keys.length;i++)
        {
            if(keys[i]==='menu') continue;
            if(keys[i]==='config_type') continue;
            if(keys[i]==='XTOKENIZE_SETTINGS') continue;
            if(JSON.stringify(newValue[keys[i]])!==JSON.stringify(oldValue[keys[i]]))
            {   
                if(JSON.stringify(newValue[keys[i]])!=="{}")
                {
                    this[keys[i]].set(newValue[keys[i]]['name'],newValue[keys[i]])
                }
             }
        }
    }

    /**
     * @method updateCurrentConfig
     * @description
     * Updates the current configuration with the provided new configuration. If the new configuration is
     * 'reset', it resets the current configuration to its default state.
     *
     * @param {object|string} newConfig - The new configuration to update or 'reset' to reset the configuration.
     * @returns {Promise<boolean>} - Returns true if the configuration was updated successfully.
     * @throws {string} - Error message if there was a problem updating the current config.
     */
    updateCurrentConfig = async(newConfig)=>{
        try
        {
            if(newConfig==='reset')
            {
                let reset = {
                    menu:'Main',
                    config_type:'',
                    IC:{},
                    IC_DISTRIBUTION:{},
                    NFT:{},
                    NFT_METADATA:{},
                    NFT_MINT:{},
                    NFT_DISTRIBUTION:{},
                    XTOKENIZE_SETTINGS:this.getConfigs('XTOKENIZE_SETTINGS'),
                }
                this.CURRENT_CONFIG.set(reset)
            }
            else
            {
                this.CURRENT_CONFIG.set(newConfig)
                return true
            }
        }
        catch(err)
        {
            console.log(`There was a problem updating the current config:`,err)
        }
    }

    /**
     * @method setConfig
     * @description
     * Sets a new configuration for the specified configType and configName.
     *
     * @param {string} configType - The type of configuration to set.
     * @param {string} configName - The name of the configuration to set.
     * @param {object} config - The configuration object to set.
     * @returns {Promise<void>}
     */
    setConfig= async(configType,configName,config)=>{
        this[configType].set(configName,config)
    }

    /**
     * @function updateTestWallets
     * @description
     * Updates the test wallets with the provided additional test wallets.
     *
     * @param {Array} additonalTestWallets - An array of additional test wallets to add.
     * @returns {Promise<void>}
     */
    updateTestWallets = async(additonalTestWallets)=>{
        let currentTestWallets = this.TEST_WALLETS.get("wallets")
        if(currentTestWallets.length===0) currentTestWallets = additonalTestWallets
        else {
            currentTestWallets.push.apply(currentTestWallets,additonalTestWallets)
         }
            this.TEST_WALLETS.set("wallets",currentTestWallets)
        }

    /**
     * @function initialize
     * @description
     * Initializes the configuration handler by setting up the default configurations and listeners for
     * changes in the current configuration.
     *
     * @returns {Promise<void>}
     */    
    initialize = async()=>{
        let XTK_settings = Object.keys(this.XTOKENIZE_SETTINGS.store)
        let IC_projects= Object.keys(this.IC.store)
        let IC_distributions=Object.keys(this.IC_DISTRIBUTION.store)
        let NFT_projects = Object.keys(this.NFT.store)
        let NFT_metadatas=Object.keys(this.NFT_METADATA.store)
        let NFT_mints=Object.keys(this.NFT_MINT.store)
        let NFT_distributions =Object.keys(this.NFT_DISTRIBUTION.store)
        let TEST_wallets = Object.keys(this.TEST_WALLETS.store)
        let TRANSACTIONS = Object.keys(this.TRANSACTIONS.store)
        if(XTK_settings.length===0) 
        {
            this.XTOKENIZE_SETTINGS.set({
                "terms":
                {
                    "TermsAndConditions":"https://www.x-tokenize.com/terms-and-conditions",
                    "TermsAndConditionsHash":"",
                    "agreed":false
                },
                "config_type":"",
                "config_name":"",
                "xumm":{type:'ACCESS_TOKEN',key:'8c7f9263-64f9-484e-a967-7129281f9da9',secret:'',secretEncrypted:false,token:'',expires:''},
                "throttle":50,
                "txs_before_sleep":250,
                "sleep_time":90000,
                "max_fee":"100",
                "fee_cushion":1.5,
                "max_ledger_offset":20,
                "log_transactions":true,
                "network":null,
                "networkRPC":null,
                "funding_account":null,
                "accounts":[]
            })
        }
       
        let settings =  this.getConfigs('XTOKENIZE_SETTINGS')
        let {config_type,config_name} = settings
        if(config_type!=="" && config_name!=="")
        {
            let configs = this.getConfigs(config_type)
            let config = configs[config_name]
            let currentConfig = this.getConfigs()
            if(config_type==='IC'){
                currentConfig.config_type='IC'
                currentConfig.menu = "IssuedCurrencyMainMenu"
                currentConfig.IC = config
                currentConfig.NFT = {}

            }
            else if(config_type==='NFT'){
                currentConfig.config_type='NFT'
                currentConfig.menu = "NFTMainMenu"
                currentConfig.NFT = config
                currentConfig.IC = {}
            }
            currentConfig.IC_DISTRIBUTION={}
            currentConfig.NFT_METADATA={}
            currentConfig.NFT_MINT={}
            currentConfig.NFT_DISTRIBUTION={}
            currentConfig.XTOKENIZE_SETTINGS = settings

            this.CURRENT_CONFIG.set(currentConfig)
        }
        else this.CURRENT_CONFIG.set({menu:'Main',config_type:'',IC:{},IC_DISTRIBUTION:{},NFT:{},NFT_METADATA:{},NFT_MINT:{},NFT_DISTRIBUTION:{},XTOKENIZE_SETTINGS:settings})

        if(IC_projects.length===0) this.IC.set({})
        if(IC_distributions.length===0) this.IC_DISTRIBUTION.set({})
        if(NFT_projects.length===0) this.NFT.set({})
        if(NFT_metadatas.length===0) this.NFT_METADATA.set({})
        if(NFT_mints.length===0) this.NFT_MINT.set({})
        if(NFT_distributions.length===0) this.NFT_DISTRIBUTION.set({})
        if(TEST_wallets.length===0) this.TEST_WALLETS.set({"wallets":[]})
        if(TRANSACTIONS.length===0) this.TRANSACTIONS.set({})
        this.currentConfigListener = this.CURRENT_CONFIG.onDidAnyChange(this.handleCurrentConfigChange)
    }

    /**
     * @function getConfigs
     * @description
     * Retrieves the configurations for the specified configType.
     *
     * @param {string} configType - The type of configuration to retrieve.
     * @returns {object} - The configurations for the specified configType.
     */
    getConfigs = (configType)=>{
        switch(configType){
            case 'XTOKENIZE_SETTINGS':
                return this.XTOKENIZE_SETTINGS.store
            case 'IC':
                return this.IC.store
            case 'IC_DISTRIBUTION':
                return this.IC_DISTRIBUTION.store
            case 'NFT':
                return this.NFT.store
            case 'NFT_METADATA':
                return this.NFT_METADATA.store
            case 'NFT_MINT':
                return this.NFT_MINT.store
            case 'NFT_DISTRIBUTION':
                return this.NFT_DISTRIBUTION.store
            case 'TEST_WALLETS':
                return this.TEST_WALLETS.store
            case 'TRANSACTIONS':
                return this.TRANSACTIONS.store
            default:
                return this.CURRENT_CONFIG.store
        }
    }

    /**
     * @function getCurrentProjectName
     * @description
     * Retrieves the name of the current project from the current configuration.
     *
     * @returns {string} - The name of the current project.
     */
    getCurrentProjectName = ()=>{
        let currentConfig = this.getConfigs()
        let config_type = currentConfig.config_type
        let name = currentConfig[config_type]['name']
        return name
    }


    /**
     * @function createNewConfig
     * @description
     * Creates a new configuration for the specified configType. Prompts the user for a name and checks if it
     * already exists. If not, it creates the new configuration and updates the current configuration.
     *
     * @param {string} configType - The type of configuration to create.
     * @returns {OperationResult} OperationResult - An object containing the result and a message indicating the success or failure
     * 
     * @throws {string} - Error message if there was an error creating the new config.
     */
    createNewConfig = async(configType)=>{
        try
        {
            let configTypeConfigs = this.getConfigs(configType)
            let names = Object.keys(configTypeConfigs)
            let name = await askForTextInput('Enter a name for the new config:')
            if(names.includes(name))
            {
                errorMessage('A config with that name already exists!')
                await pressAnyKey()
                return this.createNewConfig(configType)
            }
            else
            {
                let config_type =""
                let configCreationResult
                switch(configType){
                    case 'IC':
                        configCreationResult = await createIssuedCurrencyConfig(name)
                        config_type='IC'
                        break;
                    case 'NFT':
                        configCreationResult=await createNFTConfig(name)
                        config_type='NFT'
                        break;
                    case 'IC_DISTRIBUTION':
                        configCreationResult=await createIssuedCurrencyDistributionConfig(name)
                        break;
                    case 'NFT_METADATA':
                        configCreationResult=await createMetadataConfig(name)
                        break;
                    case 'NFT_MINT':
                        configCreationResult= await createNFTMintConfig(name)
                        break;
                    case 'NFT_DISTRIBUTION':
                        configCreationResult=await createNFTDistributionConfig(name)
                        break;
                }
                if(configCreationResult.result ==='success')
                {
                    let currentConfig = this.getConfigs()
                    config_type!==""?currentConfig.config_type=config_type:null
                    currentConfig[configType] = configCreationResult.config
                    this.updateCurrentConfig(currentConfig)
                    return {result:'success',message:`New ${configType} configuration named ${name} was successfully created!`}
                }
                else
                {
                    return {result:'warn' ,message:`New ${configType} configuration named ${name} was not created!`}
                }
            }
        }
        catch(err)
        {
            console.log('There was an error creating the new config')
        }
    }

    /**
    * @function selectConfig
    * @description
    * Prompts the user to select a configuration from the list of available configurations for the specified
    * configType. Updates the current configuration with the selected configuration.
    *
    * @param {string} configType - The type of configuration to select.
    * @returns {OperationResult} - An object containing the result and a message indicating the success or failure of the operation.
    * @throws {string} - Error message if there was a problem selecting the config.
    */
    selectConfig= async(configType)=>{
        try{
            let names
            let currentConfig = this.getConfigs()
            let configs= this.getConfigs(configType)
            if(configType==='IC' || configType==='NFT') names = Object.keys(configs);
            else  
            {
                names =[]
                let projectName = this.getCurrentProjectName()
                let configKeys= Object.keys(configs)
                if(configKeys.length===0) return {result:'warn',message:'No configs found!'}
                else configKeys.forEach((key)=>{if(configs[key].projectName === projectName) names.push(key)})
            }
            if(names.length>0)
            {
                names.push('Cancel')
                let configToManage = await askWhichFromList('Which config would you like to manage?',names)
                if(configToManage==='Cancel') return {result:'warn',message:'No config selected'}
                else 
                {
                    if(configType==='IC' || configType==='NFT') currentConfig.config_type=configType    
                    currentConfig[configType]=configs[configToManage]
                    await this.updateCurrentConfig(currentConfig);
                    return {result:'success',message:'Config selected'}
                }
            }                
            return{result:'warn',message:'No configs found'}
        }
        catch(err)
        {
            console.log('There was a problem selecting the config: ',err)
        }
    }

}

export const configHandler = new ConfigHandler();
