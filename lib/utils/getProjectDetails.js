const conf = new(require('conf'))();
const chalk = require('chalk')

const getProjectDetails = async (network,project)=>{
    return new Promise((resolve,reject)=>{
        try{
        let projects = network==='Test'?conf.get('Test-Projects'):conf.get('Main-Projects');
            if(projects&&projects.length>0)
            {
                for(let i = 0; i<projects.length;i++){
                    if(projects[i].project===project){
                        resolve(projects[i])
                    }
                }
            }
            else{
                reject(chalk.redBright.bold('No existing projects...'))
            }
        }
        catch(err)
        {
            reject(chalk.redBright.bold('There was a problem storing your configuration...'))
        }
    })
}

module.exports={getProjectDetails}