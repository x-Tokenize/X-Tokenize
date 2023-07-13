import chalk from 'chalk';
import { Console } from 'console';
import { Transform } from 'stream';

 /**
 * @function table
 * @description
 * This function takes an input object or array and a color, then formats and prints the input as a table
 * with the specified color. It first creates a Transform stream and a Console instance to format the input as a table.
 * Then, it processes the table string to modify its appearance and finally prints the table with the specified color
 * using the chalk library.
 * 
 * @param {Object|Array} input - The input object or array to be formatted and printed as a table.
 * @param {string} color - The color to be used for printing the table, either 'red' or any other value for green.
 * @returns {void}
 */

export const table=(input,color)=> {
    const ts = new Transform({ transform(chunk, enc, cb) { cb(undefined, chunk) } })
    const logger = new Console({ stdout: ts })
    logger.table(input)
    const table = (ts.read() || '').toString()
    let result = '';
    for (let row of table.split(/[\r\n]+/)) {
      let r = row.replace(/[^┬]*┬/, '┌');
      r = r.replace(/^├─*┼/, '├');
      r = r.replace(/│[^│]*/, '');
      r = r.replace(/^└─*┴/, '└');
      r = r.replace(/'/g, ' ');
      result += `${r}\n`;
    }
    color==='red'?console.log(chalk.redBright.bold(result)):console.log(chalk.greenBright.bold(result));
  }
