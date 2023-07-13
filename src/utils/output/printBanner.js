import chalk from 'chalk';
import figlet from 'figlet';

 /**
 * @function printBanner
 * @description
 * Clears the console and prints the 'X - Tokenize' banner in green color using the figlet library with a
 * full horizontal layout.
 *
 * @returns {void} - No return value.
 */

export const printBanner =() =>{
    console.clear()
    console.log(chalk.greenBright(figlet.textSync('X - Tokenize',{ horizontalLayout: 'full' })));
    return
}