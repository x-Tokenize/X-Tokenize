import { infoMessage,warningMessage, askYesNo,askWhichFromList, askForNumberMinMax, askWhichFromCheckbox } from "../../utils/index.js";
import { configHandler } from "../configHandler.js";


/**
 * @function prepareNftsToAttachToDistribution
 * @description
 * This function is responsible for preparing NFTs to be attached to a distribution. It prompts the user
 * to select an NFT mint configuration and filters available NFTs based on the distribution type and payment type. The
 * user can choose to attach all NFTs, a specific amount, or specific NFTs. The function then updates the NFT mint
 * configuration and returns the prepared NFTs along with the updated mint configuration.
 * 
 * @param {string} distributionName - The name of the distribution to which the NFTs will be attached.
 * @param {string} distributionType - The type of the distribution (e.g., 'Simple Distribution').
 * @param {string} paymentType - The type of payment for the distribution (e.g., 'IC' for Issued Currency).
 * @returns {Promise<Object>} - An object containing the result, message, prepared NFTs, and the updated mint configuration.
 * @throws {Error} - If there is a problem attaching NFTs to the distribution.
 */
export const prepareNftsToAttachToDistribution = async(distributionName,distributionType,paymentType) =>{
    try{
        infoMessage(`Please select the NFT Mint config you would like to attach to the distribution.`)
        let selectConfigResult = await configHandler.selectConfig('NFT_MINT');
        if(selectConfigResult.result !=='success') return selectConfigResult
        else
        {
            let currentConfig = await configHandler.getConfigs();
            let nfts= [...currentConfig.NFT_MINT.items];
            let availableNFTs
            if(distributionType === 'Simple Distribution' && paymentType ==='IC')
            {
                if(currentConfig.NFT_MINT.onlyXRP===true)
                {
                    warningMessage(`The selected mint configuration only allows XRP payments...`)
                    availableNFTs=[]
                }
                else availableNFTs = nfts.filter((nft)=>nft.status==='verified' && nft.attachedToDistribution===false && nft.nftokenID!==null)
            }
            else availableNFTs = nfts.filter((nft)=>nft.status==='verified' && nft.attachedToDistribution===false && nft.nftokenID!==null)
            
            if(availableNFTs.length ===0)
            {
                warningMessage(`There aren't any NFTs in the selected mint configuration that are available to attach to this distribution.`)
                warningMessage(`Check that the NFTs have been verified and have not already been attached to a distribution.`)
                if(await askYesNo(`Would you like to select a different mint configuration?`,true)) return await prepareNftsToAttachToDistribution(distributionName,distributionType,paymentType)
                else  return {result:'warn',message:'No NFTs available to attach to the distribution.'}
            }
            else
            {
                let copyAvailableNFTs = [...availableNFTs]
                let nftsToAttach = []
                let filterOption = await askWhichFromList('Select an option to attach NFTs:',['All','Specific Amount','Specific NFTs'])
                    //await askQuestion({type:'list',message:'Select an option to attach NFTs:',choices:filterOptions})
                switch(filterOption)
                {
                    case 'All':
                        nftsToAttach = copyAvailableNFTs.map((nft)=>{return nft})
                        break;
                    case 'Specific Amount':
                        let amountToAttach= await askForNumberMinMax(`Enter the amount of NFTs to attach (max:${copyAvailableNFTs.length}):`,0,copyAvailableNFTs.length)
                        nftsToAttach = copyAvailableNFTs.slice(0,amountToAttach)
                        // nftsToAttach = sliced.map((nft)=>{return nft.nftokenID})
                        break;
                    case 'Specific NFTs':
                        let specificNFTs = await askWhichFromCheckbox('Select the NFTs to attach:',copyAvailableNFTs.map((nft)=>{return nft.nftokenID}))
                         nftsToAttach = copyAvailableNFTs.filter((nft)=>{
                            if(specificNFTs.includes(nft.nftokenID)) return nft
                        })
                        break;
                }
                let items = currentConfig.NFT_MINT.items
                let nftsAttached=[]
                for(let i = 0;i<nftsToAttach.length;i++)
                {
                    let nft = nftsToAttach[i]
                    let itemIndex = items.findIndex((item)=>item.nftokenID===nft.nftokenID)
                    if(itemIndex ===-1) infoMessage(`Could not find NFT with ID: ${nft.nftokenID} in the mint config.`)
                    else
                    {
                        items[itemIndex].attachedToDistribution = true
                        items[itemIndex].distributionName = distributionName
                        let anNFT = {
                            id:i,
                            status:'pending',
                            nftokenID:nft.nftokenID,
                            file:nft.file,
                            uri:nft.uri,
                            offer:{
                                offerID:null,
                                destination:null,
                                txHash:null,
                                preliminaryTxResult:null,
                                finalTxResult:null,
                                ledgerIndex:null,
                            },
                            acceptOffer:{
                                address:null,
                                txHash:null,
                                finalTxResult:null,
                                ledgerIndex:null,
                            },
                            purchase:{
                                address:null,
                                txHash:null,
                                finalTxResult:null,
                                ledgerIndex:null,
                            }
                        }
                        nftsAttached.push(anNFT)
                    }
                   
                }
                infoMessage(`Prepared  ${nftsAttached.length} NFTs to attach to the distribution.`)
                if(await askYesNo(`Is this correct?`,true)) return {result:'success',message:`Prepared  ${nftsAttached.length} NFTs to attach to the distribution.`,nfts:nftsAttached,updatedMintConfig:currentConfig.NFT_MINT}
                else{
                    if(await askYesNo(`Would you like to try again?`,true)) return await prepareNftsToAttachToDistribution(distributionName,distributionType,paymentType)
                    else return {result:'warn',message:'Cancelled attaching NFTs to the distribution.'}
                    
                }
            }
        }

    }
    catch(err)
    {
        console.log('There was a problem attaching NFTs to the distribution: ',err)
    }
}