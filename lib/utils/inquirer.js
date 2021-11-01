const inquirer = require('inquirer');

module.exports = {
    askNetworkType: ()=>
    {
        const questions =[
            {
                name:'network',
                type:'list',
                choices:['Test','Main'],
                message:'Please choose the network you would like to connect to.',
                validate:function(value){
                    if(value.length)
                    {
                        return true;
                    }
                    else{
                        return 'Please choose the network you would like to connect to.'
                    }
                }

            }
        ]
        return inquirer.prompt(questions);
    },
    askManageType: (projects)=>{
        {
            let choices = ['Create New Project','Tools','Switch Network']

            projects.length>0?choices.splice(1,0,'Manage Existing Projects'):choices
            const questions = [
                {
                    name:'manageType',
                    type:'list',
                    choices:choices,
                    message:'How can x-tokenize be of assistance?',
                    validate:function(value){
                        if(value.length)
                        {
                            return true;
                        }
                        else{
                            return 'How can x-tokenize be of assistance?'
                        }
                    }
                }
            ]
            return inquirer.prompt(questions);
        }
    },
    askToolType: ()=>{
        {
            let choices = ['Create Funded Wallets','Create General Wallet','View Funded Wallets','Set TrustLines To An Existing Project','Home']
 
            const questions = [
                {
                    name:'toolType',
                    type:'list',
                    choices:choices,
                    message:'Which tool would you like to use?',
                    validate:function(value){
                        if(value.length)
                        {
                            return true;
                        }
                        else{
                            return 'Which tool would you like to use?'
                        }
                    }
                }
            ]
            return inquirer.prompt(questions);
        }
    },
    WalletCreation:()=>{
        {
            const questions = [
                {
                    name:'walletType',
                    type:'list',
                    choices:['Random Wallet','Vanity Wallet (i.e: rMiKecq8hCdPKSPJkPmyZ4Mi1oG2FFkT)','From Seed'],
                    message:'Choose wallet creation method.',
                    validate:function(value){
                        if(value.length)
                        {
                            return true;
                        }
                        else{
                            return 'Choose wallet creation method.'
                        }
                    }
                }
            ]
            return inquirer.prompt(questions);
        }
    },
    VanityPhrase:()=>{
        {
            const questions = [
                {
                    name:'phrase',
                    type:'input',
                    message:'Please enter a vanity phrase.(The longer the phrase the longer the generation will take)',
                    validate:function(value){
                        if(value.length)
                        {
                            return true;
                        }
                        else{
                            return 'Please enter a vanity phrase.(The longer the phrase the longer the generation will take)'
                        }
                    }
                }
            ]
            return inquirer.prompt(questions);
        }
    },
    SeedPhrase:()=>{
        {
            const questions = [
                {
                    name:'seed',
                    type:'input',
                    message:'Please enter your seed phrase.',
                    validate:function(value){
                        if(value.length)
                        {
                            return true;
                        }
                        else{
                            return 'Please enter your seed phrase.'
                        }
                    }
                }
            ]
            return inquirer.prompt(questions);
        }
    },
    askProjectName:()=>{
        {
            const questions = [
                {
                    name:'name',
                    type:'input',
                    message:'Please enter a name for your project. ie:SuperCoolToken (no spaces)',
                    validate:function(value){
                        if(value.length)
                        {
                            return true;
                        }
                        else{
                            return 'Please enter a name for your project. ie:SuperCoolToken (no spaces)'
                        }
                    }
                }
            ]
            return inquirer.prompt(questions);
        }
    },
    askAccountIssuerSettings:()=>{
        {
            const options =["Default Ripple","Change Tick Size (default 5)","Set Transfer Fee","Add Domain Name", "Authorized Trust Lines only", "Require Destination Tags", "Disallow XRP", ]
            const questions = [
                {
                    name:'settings',
                    type:'checkbox',
                    message:'Let\'s set up your issuing account\'s settings: (default are reccomended) \n',
                    choices:options,
                    default:["Default Ripple",],
                    disabled:"Default Ripple",
                    validate:function(value){
                        if(value.length)
                        {
                            return true;
                        }
                        else{
                            return 'Let\'s set up your issuing account\'s settings: (default are reccomended) \n'
                        }
                    }
                }
            ]
            return inquirer.prompt(questions);
        }
    },
    askAccountHotSettings:()=>{
        {
            const options =["Default Ripple","Change Tick Size (default 5)","Set Transfer Fee","Add Domain Name", "Authorized Trust Lines only", "Require Destination Tags", "Disallow XRP", ]
            const questions = [
                {
                    name:'settings',
                    type:'checkbox',
                    message:'Let\'s set up your hot account\'s settings: (default are reccomended) \n',
                    choices:options,
                    default:["Default Ripple","Authorized Trust Lines only",],
                    disabled:"",
                    validate:function(value){
                        if(value.length)
                        {
                            return true;
                        }
                        else{
                            return 'Let\'s set up your hot account\'s settings: (default are reccomended) \n'
                        }
                    }
                }
            ]
            return inquirer.prompt(questions);
        }
    },
    askTickSize:()=>{
        {
            const questions = [
                {
                    name:'tickSize',
                    type:'input',
                    message:'Set tick size (default 5, min:3, max:15):',
                    validate:function(value){
                        if(value.length && value>=3 && value<=15)
                        {
                            return true;
                        }
                        else{
                            return 'Set tick size (default 5, min:3, max:15):'
                        }
                    }
                }
            ]
            return inquirer.prompt(questions);
        }
    },
    askTransferFee:()=>{
        {
            const questions = [
                {
                    name:'transferFee',
                    type:'input',
                    message:'Set Transfer Fee (default 0, reccomended:1-3%, max:100%):',
                    validate:function(value){
                        if(value.length && value>=0 && value<=100)
                        {
                            return true;
                        }
                        else{
                            return 'Set Transfer Fee (default 0, reccomended:1-3%, max:100%):'
                        }
                    }
                }
            ]
            return inquirer.prompt(questions);
        }
    },
    askDomain:()=>{
        {
            const questions = [
                {
                    name:'domain',
                    type:'input',
                    message:'Set your domain:',
                    validate:function(value){
                        if(value.length)
                        {
                            return true;
                        }
                        else{
                            return 'Set your domain:'
                        }
                    }
                }
            ]
            return inquirer.prompt(questions);
        }
    },
    askTokenTicker:()=>{
        {
            const questions = [
                {
                    name:'symbol',
                    type:'input',
                    message:'Please set your Token ticker (ie. USD, MikeCoin, etcToken):',
                    validate:function(value){
                        if(value.length)
                        {
                            return true;
                        }
                        else{
                            return 'Please set your Token ticker (ie. USD, MikeCoin, etcToken):'
                        }
                    }
                }
            ]
            return inquirer.prompt(questions);
        }
    },
    askTokenAmount:()=>{
        {
            const questions = [
                {
                    name:'amount',
                    type:'input',
                    message:'How many tokens would like to issue:',
                    validate:function(value){
                        if(Number(value)>0)
                        {
                            return true;
                        }
                        else{
                            return 'How many tokens would like to issue:'
                        }
                    }
                }
            ]
            return inquirer.prompt(questions);
        }
    },
    selectProject:(projects)=>{
        {
                let projectNames=[]
                   for(let i=0;i<projects.length;i++)
                   {
                    projectNames.push(projects[i].project)
                   }

                   const questions = [
                       {
                           name:'project',
                           type:'list',
                           choices:projectNames,
                           message:`Which project would you like to manage?`,
                           validate:function(value){
                               if(value.length)
                               {
                                   return true;
                               }
                               else{
                                   return `Which project would you like to manage?`
                               }
                           }
                       }
                   ]
                   return inquirer.prompt(questions);
               }
           },
           selectAProject:(projects)=>{
            {
                    let projectNames=[]
                       for(let i=0;i<projects.length;i++)
                       {
                        projectNames.push(projects[i].project)
                       }
    
                       const questions = [
                           {
                               name:'project',
                               type:'list',
                               choices:projectNames,
                               message:`Which project would you like to set Trustlines to?`,
                               validate:function(value){
                                   if(value.length)
                                   {
                                       return true;
                                   }
                                   else{
                                       return `Which project would you like to set Trustlines to?`
                                   }
                               }
                           }
                       ]
                       return inquirer.prompt(questions);
                   }
               },
           askProjectManageType:(project)=>{
            {
                       let choices = ['Project Overview','Airdrop Tokens','Modify Account Settings','Home',]
           
                       const questions = [
                           {
                               name:'manageType',
                               type:'list',
                               choices:choices,
                               message:`How would you like to manage the ${project} project?`,
                               validate:function(value){
                                   if(value.length)
                                   {
                                       return true;
                                   }
                                   else{
                                       return `How would you like to manage the ${project.project} project?`
                                   }
                               }
                           }
                       ]
                       return inquirer.prompt(questions);
                   }
               },
               askAirdropType:()=>{
                {
                           let choices = ['Airdrop All Trustlines','Airdrop Random Trustline','Home',]
               
                           const questions = [
                               {
                                   name:'airdropType',
                                   type:'list',
                                   choices:choices,
                                   message:`How would you like to airdrop?`,
                                   validate:function(value){
                                       if(value.length)
                                       {
                                           return true;
                                       }
                                       else{
                                           return `How would you like to airdrop?`
                                       }
                                   }
                               }
                           ]
                           return inquirer.prompt(questions);
                       }
                   },
                   askAirdropAmountPerTrustline:()=>{
                    {
                        const questions = [
                            {
                                name:'amount',
                                type:'input',
                                message:'How many Tokens per Trustline: (If less than 1 be sure to lead with a zero i.e: 0.2)',
                                validate:function(value){
                                    if(Number(value)>0)
                                    {
                                        return true;
                                    }
                                    else{
                                        return 'How many Tokens per Trustline:'
                                    }
                                }
                            }
                        ]
                        return inquirer.prompt(questions);
                    }
                },
                   
               askNumberOfWallets:()=>{
                {
                    const questions = [
                        {
                            name:'amount',
                            type:'input',
                            message:'How many wallets would you like to create:',
                            validate:function(value){
                                if(Number(value)>0)
                                {
                                    return true;
                                }
                                else{
                                    return 'How many wallets would you like to create:'
                                }
                            }
                        }
                    ]
                    return inquirer.prompt(questions);
                }
            },
           
            pressEnterToReturn:()=>{
                {
                    const questions = [
                        {
                            name:'return',
                            type:'input',
                            message:'Press enter to return:',
                            validate:function(value){
                                if(true)
                                {
                                    return true;
                                }
                                else{
                                    return 'Press enter to return:'
                                }
                            }
                        }
                    ]
                    return inquirer.prompt(questions);
                }
            },
}