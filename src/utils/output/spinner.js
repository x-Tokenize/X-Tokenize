import { wait } from '../helpers/wait.js'
import pkg from 'clui';
const {Spinner} = pkg;

 /**
 * @function createSpinner
 * @description
 * Creates a new spinner instance with the given message and starts it. The spinner is used to indicate a
 * loading or processing state in the command line interface. The function also waits for 100 milliseconds before
 * returning the spinner instance.
 * 
 * @param {string} message - The message to be displayed alongside the spinner.
 * @returns {Promise<Spinner>} - A promise that resolves to the created spinner instance.
 * @throws {Error} - If there is an error while creating or starting the spinner.
 */
export const createSpinner = async (message) => {
        try{
            let spinner = new Spinner(message)
            spinner.start()
            await wait(100)
            return spinner
        }
        catch(err){
            reject(err)
        }
}

/**
 * @function stopSpinner
 * @description
 * Stops the given spinner instance and waits for 50 milliseconds before returning. This function is used
 * to stop the loading or processing indication in the command line interface.
 * 
 * @param {Spinner} spinner - The spinner instance to be stopped.
 * @returns {Promise<null>} - A promise that resolves to null after stopping the spinner and waiting for 50 milliseconds.
 * @throws {Error} - If there is an error while stopping the spinner.
 */
export const stopSpinner = async (spinner) => {
        try{
            spinner.stop()
            await wait(50)
            return null
        }
        catch(err){
            reject(err)
        }
}