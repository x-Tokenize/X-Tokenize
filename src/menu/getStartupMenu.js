import { configHandler } from '../config/configHandler.js'

 /**
 * @function getStartUpMenu
 * @description
 * This function retrieves the current configuration settings from the configHandler and determines the
 * appropriate menu to display based on the config_type. It supports three menu types: IssuedCurrencyMainMenu,
 * NFTMainMenu, and Main.
 * 
 * @returns {Promise<string>} - The name of the menu to be displayed based on the current configuration settings.
 * @throws {Error} - If there is an issue retrieving the configuration settings from the configHandler.
 */
export const getStartUpMenu = async () => {

    

    let currentConfig = await configHandler.getConfigs()
    let settings = currentConfig.XTOKENIZE_SETTINGS
    let currentMenu
    switch(settings.config_type)
    {
        case 'IC':
            currentMenu = 'IssuedCurrencyMainMenu'
            break
        case 'NFT':
            currentMenu = 'NFTMainMenu'
            break
        default:
            currentMenu = 'Main'
            break
    }
    return currentMenu

}

