#! /usr/bin/env node
const {initialize} = require('./lib/tokenize/initialize');
const { main } = require('./lib/tokenize/main');


const tokenize = async() =>{
    try{
        const {network,client} = await initialize();
        await main(network,client)
    }
    catch(err)
    {
        tokenize();
    }
}

tokenize();