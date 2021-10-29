const clear = require('clear');
const figlet = require('figlet');
const chalk = require('chalk');

let printBanner =()=>{
    clear();
    console.log(chalk.greenBright(figlet.textSync('X - Tokenize', { horizontalLayout: 'full'})));
    return
}

module.exports={
    printBanner
}