const chalk = require('chalk')
const inquirer = require('../utils/inquirer')
const {printBanner} = require('../utils/printBanner')
const { printProjectDetails } = require('../utils/printProjectDetails')
const { manageAirdrop } = require('./manageAirdrop')

const manageExistingProjects = async(network,client,projects) =>{
    printBanner();
    let project = await inquirer.selectProject(projects)
    console.log('Managing: '+project.project);
    let projectManageType = await inquirer.askProjectManageType(project.project)
    switch(projectManageType.manageType)
    {
        case 'Project Overview':
            await printProjectDetails(network,project.project);
            await inquirer.pressEnterToReturn();
            break;
        case 'Airdrop Tokens':
            await manageAirdrop(network,client,project.project)
            await inquirer.pressEnterToReturn();
            break;
        
        case 'Modify Account Settings':
            
            break;
        case 'Home':
            //resolve()
            break;
    }

}

module.exports={manageExistingProjects}