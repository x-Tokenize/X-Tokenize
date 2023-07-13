import { configHandler } from '../config/configHandler.js'
import {askWhichFromList,successMessage,errorMessage,warningMessage,pressAnyKey,printBanner,log} from '../utils/index.js'

 /**
 * @function invoke
 * @description
 * Invokes the specified handler function from the menu and handles the result of the invocation. Logs the
 * result, displays appropriate messages, and navigates to the next menu or option based on the result.
 * 
 * @param {Object} menu - The menu object containing options and handlers.
 * @param {string} option - The current option being processed.
 * @param {string} handler - The handler function to be invoked.
 * @returns {Promise} - A promise that resolves when the menuHandler function is called with the next menu or option.
 * @throws {Error} - If there is an error invoking the handler.
 */
export const invoke = async (menu,option,handler) =>{
        try
        {
            log.addLog(`info`,`Running ${menu[option].handlers[handler].func}`)
            let invocation = await menu[option].handlers[handler].func()
            let logType,navigateTo
          
            switch(invocation.result)
            {
                case 'success':
                    logType='info'
                    successMessage(invocation.message)
                    log.addLog(`info`,`Success running ${menu[option].handlers[handler].func}`)
                    navigateTo = menu[option].handlers[handler].next
                    break
                case 'warn':
                    logType='warn'
                    warningMessage(invocation.message)
                    log.addLog(`warn`,`Warning running ${menu[option].handlers[handler].func}`)
                    navigateTo = menu[option].handlers[handler].warn   ?   menu[option].handlers[handler].warn   :   menu[option].handlers[handler].next
                    break
                case 'failed':
                    logType='error'
                    log.addLog(`error`,`Error running ${menu[option].handlers[handler].func}`)
                    errorMessage(invocation.message)
                    navigateTo = menu[option].handlers[handler].failed   ?   menu[option].handlers[handler].failed   :   menu[option].handlers[handler].next
                    break
                default:
                    logType='error'
                    log.addLog(`error`,`Error running ${menu[option].handlers[handler].func}`)
                    errorMessage(`We got a result of ${invocation.result} but we don't know what to do with it!`)
                    navigateTo = menu[option].handlers[handler].next
                    break
            }
            await pressAnyKey()
            log.addLog(logType,invocation.message)
            log.addLog(`info`, `Result: ${invocation.result}`)
            if(navigateTo === 'exit') process.exit(0)
            return menuHandler(menu,navigateTo)
          
        }
        catch(err){
            console.log('There was an error invoking a handler: ',err)
        }
}


/**
 * @function menuHandler
 * @description
 * Handles the navigation and execution of menu options and their associated handlers. Updates the current
 * configuration if necessary, and processes the handler based on its type (menu or function).
 * 
 * @param {Object} menu - The menu object containing options and handlers.
 * @param {string} option - The current option being processed.
 * @returns {Promise} - A promise that resolves when the menuHandler function is called with the next menu
 * or option, or when the invoke function is called.
 * @throws {Error} - If there is a problem with the menu handler.
 */
export const menuHandler = async(menu,option) =>{
        try
        {
            printBanner()
            log.addLog('info',`Navigating to ${option}`)
            let currentConfig=await configHandler.getConfigs()
            if(menu[option].id==='main' && currentConfig.config_type!=='') await configHandler.updateCurrentConfig("reset")
        
            let {message,handlers} = menu[option]
            let handler = await askWhichFromList(message,Object.keys(handlers))
            let handlerType = menu[option].handlers[handler].type
            switch(handlerType)
            {
                case 'menu': 
                    return menuHandler(menu,menu[option].handlers[handler].menu)
                case 'function': 
                    return invoke(menu,option,handler);
                default:
                    warningMessage(`Unknown handler type found: ${option.type} on option ${option}`)
                    await pressAnyKey()
                    return menuHandler(option);
            }
        }
        catch(err)
        {
            console.log()
                   errorMessage(`Message: ${err.message}`)
                   errorMessage(`Stack: ${err.stack}`)
                   console.log()
                   let error ={error:err.message,stack:err.stack}
                   log.addLog(`error`,JSON.stringify(error))
            log.addLog('error',`There was a problem with the menu handler: ${err}`)

        }
}



