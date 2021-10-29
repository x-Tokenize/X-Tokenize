const CLI = require('clui')
const Spinner =CLI.Spinner;
let status = new Spinner();

let startSpinner = async (message)=>
{
    await status.message(message);
    await status.start();
    return status;
}

let stopSpinner = async ()=>
{
    await status.stop()
    return;
}

let updateSpinner = async(newMessage)=>
{
    await status.message(newMessage);
    return status;
}

module.exports =
{
    startSpinner,
    stopSpinner,
    updateSpinner
}