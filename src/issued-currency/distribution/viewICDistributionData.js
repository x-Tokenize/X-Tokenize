import { infoMessage,warningMessage,table,printBanner, } from "../../utils/index.js";
import { configHandler } from "../../config/configHandler.js";



/**
 * @function getAndPrintICDistributionData
 * @description
 * Calculates and prints the distribution data for a given Issued Currency distribution. It computes the
 * expected distribution amount, total distributed amount, pending distributions, and pending verifications. It also
 * formats and prints the distribution status and results.
 * 
 * @param {ICDistributionConfig} IC_DISTRIBUTION - The Issued Currency distribution object containing distribution data.
 * @param {boolean} printIt - A flag to determine if the distribution data should be printed to the console.
 * @returns {Object} - An object containing the statusData and resultData of the distribution.
 */
const getAndPrintICDistributionData = (IC_DISTRIBUTION,printIt)=>{
    let lines = IC_DISTRIBUTION.lines;
    let expectedDistributionAmount = 0
    let totalDistributed =0;
    let pendingDistributions =0;
    let pendingVerification =0
    lines.forEach((line)=>{
        expectedDistributionAmount+=Number(line.amount)
        if(line.status==='verified' && line.finalResult ==='tesSUCCESS') totalDistributed+=Number(line.amount)
        else if(line.status ==='pending') pendingDistributions++
        else if(line.status ==='sent')pendingVerification++
    })

    let statusData ={
        "Name":IC_DISTRIBUTION.name,
        "Status":IC_DISTRIBUTION.status,
        "Starting":IC_DISTRIBUTION.ledgerIndexStart,
        "Ending":IC_DISTRIBUTION.ledgerIndexEnd?IC_DISTRIBUTION.ledgerIndexEnd:'Still Active',
        "Currency Code":IC_DISTRIBUTION.currencyCode,
        "Currency Hex":IC_DISTRIBUTION.currencyHex,
    }

    let resultData = {
        "Name":IC_DISTRIBUTION.name,
        "Lines":lines.length,
        "Expected Amount":expectedDistributionAmount,
        "Distributed Amount":totalDistributed,
        "Pending":pendingDistributions,
        "Pending Verification":pendingVerification,

        "Successful":IC_DISTRIBUTION.successfulDistributions,
        "Failed":IC_DISTRIBUTION.failedDistributions,
       
    }
    if(printIt)
    {
        infoMessage(`Distribution Name: ${IC_DISTRIBUTION.name}`)
        warningMessage(`Distribution Status:`)
        table([statusData])
        console.log()
        warningMessage(`Distribution Results:`)
        table([resultData])
        console.log()
    }
    return {statusData,resultData}
    }

/**
 * @function viewICDistributionData
 * @description
 * Retrieves and displays the distribution data for all Issued Currency distributions associated with a
 * project. It calculates the total distribution data and prints it in a formatted table. If the
 * allDistributionsForProject flag is set, it will display data for all distributions, otherwise it will display data
 * for the current distribution.
 * 
 * @param {boolean} allDistributionsForProject - A flag to determine if the function should display data for all
 * distributions associated with the project.
 * @returns {OperationResult} - An object containing the result and a message.
 * @throws {string} - An error message if there was a problem getting the distribution data.
 */
export const viewICDistributionData = async(allDistributionsForProject)=>{
        try
        {
            printBanner()
            let currentConfig = await configHandler.getConfigs();
            let projectName = currentConfig.IC.name;
            let ICDistributions=[]
            if(allDistributionsForProject)
            {
                let distributions = await configHandler.getConfigs(`IC_DISTRIBUTION`)
                let projectDistributions = Object.keys(distributions).filter((key)=>distributions[key].projectName===projectName)
                if(projectDistributions){
                    for(let i = 0;i<projectDistributions.length;i++)
                    {
                        let distribution = projectDistributions[i]
                        ICDistributions.push(distributions[distribution])
                    }
                }
                else return {result:'warn',message:`There are no distributions for ${projectName}`}
            }
            else ICDistributions.push(currentConfig.IC_DISTRIBUTION)
            
            let allStatuses=[]
            let allResults = []

            if(ICDistributions.length>0)
            {
                for(let i = 0;i<ICDistributions.length;i++)
                {
                    let IC_DISTRIBUTION = ICDistributions[i]
                    let {statusData,resultData} = getAndPrintICDistributionData(IC_DISTRIBUTION,!allDistributionsForProject)
                    allStatuses.push(statusData)
                    allResults.push(resultData)
                }
            }
            else return {result:'warn',message:`There are no distributions for ${projectName}`}
            if(allDistributionsForProject) 
            {
                infoMessage(`All Distributions for ${projectName}`)
                if(allStatuses.length>1) table(allStatuses)
                let totals = {
                    "Name":'Totals',
                    "Lines":0,
                    "Expected Amount":0,
                    "Distributed Amount":0,
                    "Pending":0,
                    "Pending Verification":0,
                    "Successful":0,
                    "Failed":0

                }
             
                allResults.forEach((result)=>{
                    totals.Lines+=result.Lines
                    totals["Expected Amount"]+=result["Expected Amount"]
                    totals["Distributed Amount"]+=result["Distributed Amount"]
                    totals.Pending+=result.Pending
                    totals["Pending Verification"]+=result["Pending Verification"]
                    totals.Successful+=result.Successful
                    totals.Failed+=result.Failed
                })
                allResults.push(totals)
                table(allResults)
            }
            
            return {result:'success',message:'Successfully retrieved distribution data.'}
        }
        catch(err)
        {
            console.log(`There was a problem getting the distribution data: ${err}`)
        }
}