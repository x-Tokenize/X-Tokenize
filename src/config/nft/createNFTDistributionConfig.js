import { configHandler } from "../configHandler.js";
import { printBanner,infoMessage,warningMessage,fancyMessage, askWhichFromList,askYesNo } from "../../utils/index.js";
import { getNFTDistributionPaymentMethod } from "./getNFTDistributionPaymentMethod.js"
import { prepareNftsToAttachToDistribution } from "./prepareNFTsToAttachToDistribution.js";

/**
 * @function createNFTDistributionConfig
 * @description
 * This function creates a new NFT distribution configuration based on user input. It starts by
 * initializing a distribution object with default values and then prompts the user to choose a distribution method
 * (Simple Distribution, On-Demand Distribution, or Trustline Distribution). After the user selects a distribution
 * method, the function calls getNFTDistributionPaymentMethod() to obtain the payment details for the chosen
 * distribution method. Next, the function calls prepareNftsToAttachToDistribution() to prepare the NFTs to be attached
 * to the distribution. The user is then asked to review the distribution configuration and confirm if it is correct. If
 * the user confirms, the distribution configuration is saved to the current project configuration using
 * configHandler.updateCurrentConfig(). If the user does not confirm, they are given the option to try again or cancel
 * the creation of the distribution configuration.
 * 
 * @param {string} name - The name of the NFT distribution configuration.
 * @returns {Promise<Object>} - An object containing the result ('success', 'warn', or 'error'), a
 * message describing the result, and the created distribution configuration (if successful).
 * @throws Error if there is a problem creating the distribution config.
 */
export const createNFTDistributionConfig = async(name)=>{
    try
    {
        printBanner();
        let distribution = {
            name:name,
            projectName:configHandler.getCurrentProjectName(),
            status:'created',
            timeCreated:new Date().toISOString(),
            ledgerIndexStart:null,
            ledgerIndexEnd:null,
            lastHandledLedgerIndex:null,
            numberOfNFTs:0,
            distributionType:null,
            paymentAccount:null,
            currency:{
                type:null,
                code:null,
                hex:null,
                issuer:null,
                amount:null
            },
            nfts:[]
        }
        console.log()
        infoMessage(`There are currently three types of NFT distribution methods: Simple Distribution, On-Demand Distribution and Trustline Distribution.`)
        console.log()
        warningMessage(`Simple Distribution:`)
        infoMessage(`All NFTs on the minting account are offered for sale at the same price with no specific destination.`)
        console.log()
        warningMessage(`On-Demand Distribution:`)
        infoMessage(`NFT offers are created when a buyer sends a valid payment with a valid amount to a specified account.`)
        infoMessage(`NFTs for offers are chosen at random from the minters collection.`)
        console.log()
        warningMessage(`Trustline Distribution:`)
        fancyMessage(`Coming soon...`)
        infoMessage(`NFT offers are created when a recipient account has a trustline to a token issuer.`)
        infoMessage(`NFTs for offers are chosen at random from the minters collection.`)
        console.log()
        //TODO: Add Trustline Distribution: ,'Trustline Distribution'
        let distributionType = await askWhichFromList(`Which distribution method would you like to use?`,['Simple Distribution','On-Demand Distribution','Cancel'])
        if(distributionType==='Cancel') return {result:'warn',message:'Distribution configuration creation cancelled.'}
        else
        {
            distribution.distributionType = distributionType
            printBanner()
            let paymentDetailsResult = await getNFTDistributionPaymentMethod(distributionType)
            if(paymentDetailsResult.result ==='warn') return {result:'warn',message:'Distribution configuration creation cancelled.'}
            else
            {
                distribution.paymentAccount = paymentDetailsResult.paymentDetails.paymentAccount
                distribution.currency.type = paymentDetailsResult.paymentDetails.paymentType
                distribution.currency.code = paymentDetailsResult.paymentDetails.paymentCurrency
                distribution.currency.hex = paymentDetailsResult.paymentDetails.paymentHex
                distribution.currency.issuer = paymentDetailsResult.paymentDetails.paymentIssuer
                distribution.currency.amount = paymentDetailsResult.paymentDetails.paymentAmount
                printBanner()
                let nftPreperationResult = await prepareNftsToAttachToDistribution(name,distributionType,paymentDetailsResult.paymentDetails.paymentType);
                if(nftPreperationResult.result !=='success') return nftPreperationResult
                else if(nftPreperationResult.result ==='success')
                {
                    distribution.numberOfNFTs = nftPreperationResult.nfts.length
                    printBanner()
                    infoMessage(`Prepared ${distribution.numberOfNFTs} NFTs to attach to the distribution.`)
                    infoMessage(`Please review the distribution configuration below.`)
                    console.log()
                    console.log(distribution)
                    warningMessage(`Note: NFTs have been omited from the output for brevity.`)
                    warningMessage(`Instead, the number of nfts to be distributed are shown.`)
                    if(await askYesNo(`Is this correct?`,true))
                    {
                        distribution.nfts = nftPreperationResult.nfts
                        let currentConfig = await configHandler.getConfigs()
                        currentConfig.NFT_MINT = nftPreperationResult.updatedMintConfig
                        currentConfig.NFT_DISTRIBUTION = distribution;
                        await configHandler.updateCurrentConfig(currentConfig)
                        return {result:'success',message:`Distribution configuration created successfully.`,config:distribution}
                    }
                    else
                    {
                        if(await askYesNo(`Would you like to try again?`,true)) return await createNFTDistributionConfig(name)
                        else return {result:'warn',message:'Distribution configuration creation cancelled.'}
                    }
                }
            }
        }
    }
    catch(err)
    {
        console.log("There was a problem creating the distribution config: ",err)
    }
}