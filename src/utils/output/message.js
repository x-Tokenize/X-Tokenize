
import chalk from 'chalk'

/**
 * @function errorMessage
 * @description
 * Displays an error message in red color with bold text on the console.
 * 
 * @param {string} message - The error message to be displayed.
 */
export const errorMessage = (message) => {
    console.log(chalk.redBright.bold(message))
}

/**
 * @function warningMessage
 * @description
 * Displays a warning message in magenta color with bold text on the console.
 * 
 * @param {string} message - The warning message to be displayed.
 */
export const warningMessage = (message) => {
    console.log(chalk.magenta.bold(message))
}
/**
 * @function infoMessage
 * @description
 * Displays an informational message in cyan color with bold text on the console.
 * 
 * @param {string} message - The informational message to be displayed.
 */
export const infoMessage = (message) => {
    console.log(chalk.cyan.bold(message))
}
/**
 * @function successMessage
 * @description
 * Displays a success message in green color with bold text on the console.
 * 
 * @param {string} message - The success message to be displayed.
 */
export const successMessage = (message) => {
    console.log(chalk.greenBright.bold(message))
}
/**
 * @function fancyMessage
 * @description
 * Displays a message with a rainbow color pattern (red, yellow, green, cyan, magenta) with bold text on
 * the console.
 * 
 * @param {string} message - The message to be displayed with the rainbow color pattern.
 */
export const fancyMessage = (message)=>{
    const rainbowColors = [chalk.bold.redBright, chalk.yellowBright, chalk.greenBright, chalk.cyanBright, chalk.magentaBright];
    let rainbowMessage = '';
    for (let i = 0; i < message.length; i++) {
      rainbowMessage += rainbowColors[i % rainbowColors.length](message[i]);
    }
    console.log(rainbowMessage);
}
/**
 * @function importantMessage
 * @description
 * Displays an important message in magenta color with bold text, surrounded by a red exclamation mark
 * border on the console.
 * 
 * @param {string} message - The important message to be displayed.
 */
export const importantMessage = (message)=>
{
    console.log()
    let strLen = message.length;

    let exclamations = "!"
    exclamations = exclamations.padEnd(strLen+4,"!")

    let spacerLine = ""
    spacerLine = spacerLine.padEnd(strLen+2," ")

    console.log(chalk.redBright.bold(exclamations))
    console.log(chalk.redBright.bold("!") + spacerLine + chalk.redBright.bold("!"))
    console.log(chalk.redBright.bold("!") + " " +chalk.magentaBright.bold(message)+ " " + chalk.redBright.bold("!")  )
    console.log(chalk.redBright.bold("!") + spacerLine + chalk.redBright.bold("!"))
    console.log(chalk.redBright.bold(exclamations))

}
/**
 * @function printResponse
 * @description
 * Displays a message on the console based on the response object's result property. The message will be
 * displayed with different colors and styles depending on the result value.
 * 
 * @param {Object} response - The response object containing the result and message properties.
 * @param {string} response.result - The result value, can be 'success', 'warn', or 'failed'.
 * @param {string} response.message - The message to be displayed.
 */

export const printResponse = (response)=>{
    let {result,message} = response
    switch(result)
    {
        case 'success':
            successMessage(message)
            break;
        case 'warn':
            warningMessage(message)
            break;
        case 'failed':
            errorMessage(message)
            break;
    }
}


