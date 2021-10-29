const conf = new(require('conf'))();
const chalk = require('chalk')

const storeProject = async (network,project)=>{
    return new Promise((resolve,reject)=>{
        try{
        let projects = network==='Test'?conf.get('Test-Projects'):conf.get('Main-Projects');
            if(projects&&projects.length>0)
            {
                projects.push(project);
                network==='Test'?conf.set('Test-Projects',projects):conf.set('Main-Projects',projects);
                resolve('Success creating project!')
            }
            else{
                let projects =[project];
                network==='Test'?conf.set('Test-Projects',projects):conf.set('Main-Projects',projects);  
                resolve(chalk.greenBright.bold('Success creating project!'))  
            }
        }
        catch(err)
        {
            reject(chalk.redBright.bold('There was a problem storing your configuration...'))
        }
    })
}

module.exports={storeProject}