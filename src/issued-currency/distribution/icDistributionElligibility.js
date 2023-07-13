import {askWhichFromCheckbox,askForNumberMinMax, infoMessage,errorMessage,successMessage,askYesNo, printBanner} from '../../utils/index.js'
import { loyaltyProgram,partnershipProgram,specificTrustlineSettings,minXrpBalance,nftOwnership} from './icDistributionElligibilityModels.js'

 /**
 * @function createLinesForDistribution
 * @description
 * Creates an array of eligible trustlines for distribution based on the provided lines. It prompts the
 * user to input the distribution amount for each eligible trustline and calculates if the limit is exceeded after the
 * distribution. Returns an object containing the result, lines, message, and distributionAmount.
 * 
 * @param {Array} lines - An array of trustlines to be processed for distribution.
 * @returns {CreateLinesForDistributionResult} - An object containing the result, message and (if successful) an array of formatted elligible trustlines.
 * @throws {Error} - If there is a problem creating the lines for the distribution.
 */
const createLinesForDistribution = async (lines)=>{
    try{
        printBanner()
        let distributionAmount= await askForNumberMinMax(`How much should each elligible trustline receive? (0: cancel)`,0,Number.MAX_SAFE_INTEGER)
        if(distributionAmount===0) return {result:'warn', message:'Distribution cancelled.'}
        else
        {
            console.log(lines)
            let elligibleLines = lines.map((line)=>{

                let amount = Number(distributionAmount)
                if(line.multipleNFTRewards)
                {
                    amount = Number((Number(distributionAmount) * Number(line.nftsOwned.length))).toString()
                }
                
                return {
                    account:line.account,
                    amount:amount.toString(),
                    xrpBalance:line.xrpBalance?line.xrpBalance:null,
                    nftsOwned: line.nftsOwned?line.nftsOwned:null,
                    balance:line.balance,
                    limitExceeded: ((Number(line.balance) + Number(amount)) > Number(line.limit_peer))?true:false,
                    status:'pending',
                    txHash:null,
                    preliminaryResult:null,
                    finalResult:null,
                    ledgerIndex:null,
                }
            })
            let filtered = elligibleLines.filter((line)=>line.limitExceeded!==true)
            return {result:'success',lines:filtered,message:`Found ${filtered.length} trustlines elligible for this distribution.`,distributionAmount:distributionAmount}
        }
        
    }
    catch(err)
    {
        console.log('There was a prbolem creating the lines for the distribution:',err)
    }

}

/**
 * @function icDistributionElligibility
 * @description
 * Determines the distribution eligibility based on the user's choice from a list of options. Filters the
 * trustlines based on the chosen criteria and returns the result of the distribution process.
 * 
 * @param {Object} networkRPC - The network RPC object for interacting with the XRPL.
 * @param {Array} trustlines - An array of trustlines to be processed for distribution.
 * @returns {Promise<Object>} - An object containing the result ('success' or 'warn') and message (string).
 * @throws {Error} - If there is a problem filtering the trustlines for the distribution.
 */
export const icDistributionElligibility = async(networkRPC,trustlines)=>{
    try
    {
        printBanner()
        let choices = ['Loyalty Program','Partnership Program','Specific Trustline Settings','Min XRP Balance','NFT Ownership','Distribute to All']
        let answer = await askWhichFromCheckbox('How would you like to determine the distribution elligibility?',choices)
        if(answer.indexOf('Distribute to All')!== -1){
            return await createLinesForDistribution(trustlines)
        }
        else
        {
            let filteredLines = trustlines;
            for(let i = 0;i<answer.length;i++)
            {
                console.log()
                printBanner()
                infoMessage(`Configuring ${answer[i]}...`)
                switch(answer[i])
                {
                    case 'Loyalty Program':
                        filteredLines = await loyaltyProgram(filteredLines)
                        break;
                    case 'Partnership Program':
                        filteredLines = await partnershipProgram(networkRPC,filteredLines)
                        break;
                    case 'Specific Trustline Settings':
                        filteredLines = await specificTrustlineSettings(filteredLines)
                        break;
                    case 'Min XRP Balance':
                        filteredLines = await minXrpBalance(networkRPC,filteredLines)
                        break;
                    case 'NFT Ownership':
                        filteredLines = await nftOwnership(networkRPC,filteredLines)
                        break;
                    case 'Distribute to All':
                        filteredLines = [...lines]
                        break;
                }
            }
            if(filteredLines.length>0) return await createLinesForDistribution(filteredLines)
            else
            {
                errorMessage(`There are no trustlines that meet all of the criteria.`)
                if(await askYesNo('Would you like to try again?')) return await icDistributionElligibility(networkRPC,trustlines)
                else return {result:'warn',message:'No trustlines to distribute to'}
            }
        }
    }
    catch(err)
    {
        console.log('There a was a problem filtering the trustlines for the distribution.')
        console.log('err:',err)
    }
}