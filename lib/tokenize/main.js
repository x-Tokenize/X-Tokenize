const {printBanner} = require('../utils/printBanner');
const {initialize} = require('./initialize');
const {createNewProject} = require('./createNewProject');
const {manageExistingProjects} = require('./manageExistingProjects');
const {tools} = require('./tools')
const inquirer = require('../utils/inquirer');
const conf = new (require('conf'))()

const main = async(network,client,message)=>{
    // conf.clear()
    printBanner();
    if(message){
        console.log(message)
    }
     let projects = network==='Test'?conf.get('Test-Projects'):conf.get('Main-Projects');
    if(!projects)projects=[]
    const type = await inquirer.askManageType(projects);
   
    switch(type.manageType)
    {
        case 'Create New Project':
            let createResult=await createNewProject(network,client);
            main(network,client,createResult)
            break;
        case 'Manage Existing Projects':
            await manageExistingProjects(network,client,projects)
            main(network,client)
            break;
        case 'Tools':
            let toolResult = await tools(network,client,projects)
            console.log(toolResult)
            main(network,client,toolResult)
            break;
        case 'Switch Network':
            await client.disconnect();
            initialize();
            break;
    }
}

module.exports ={main}