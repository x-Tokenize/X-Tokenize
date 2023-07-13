import { askForNumberMinMax, askForTextInput, askQuestion, infoMessage, pressAnyKey, printBanner ,createSpinner,wait, askYesNo} from '../../utils/index.js'
import { getAccountNFTs, getAllTrustlinesToAnIssuer ,getXrpBalance} from '../../xrpl/index.js'
import { parseNFTokenID} from 'xrpl'

 /**
 * @function loyaltyProgram
 * @description
 * Filters trustlines based on a minimum balance requirement. The loyalty program allows the user to set a
 * minimum balance for a trustline to be eligible for distribution.
 * 
 * @param {Array} lines - An array of trustlines.
 * @returns {Promise<Array>} - An array of filtered trustlines that meet the minimum balance requirement.
 * @throws {Error} - If there is a problem filtering the loyalty program.
 */

export const loyaltyProgram = async (lines) => {
    try {
        infoMessage(`The loyalty program allows you to set a minimum balance for a trustline to be eligible for distribution.`)
        let amount = await askForNumberMinMax(`What is the minimum balance? (0: cancel)`,0,Number.MAX_SAFE_INTEGER)
        if(amount===0) return lines
        let filteredLines = lines.filter((line)=>{return Number(line.balance)*-1>=Number(amount)})
        infoMessage(`There are ${filteredLines.length} trustlines that meet the minimum balance requirement.`)
        await pressAnyKey()
        return filteredLines
    }
    catch(err)
    {
        console.log('There was a problem filtering the loyalty program: ',err)
    }
}

/**
 * @function partnershipProgram
 * @description
 * Filters trustlines based on a minimum balance of another issued currency. The partnership program
 * allows the user to set a minimum balance of another issued currency to be eligible for distribution. The user can set
 * multiple different currencies and minimum balances.
 * 
 * @param {Object} networkRPC - The network RPC object.
 * @param {Array} lines - An array of trustlines.
 * @returns {Promise<Array>} - An array of filtered trustlines that meet the minimum balance requirement of the partnered issued currencies.
 * @throws {Error} - If there is a problem filtering the partnership program.
 */
export const partnershipProgram = async (networkRPC,lines) => {
    try 
    {
        infoMessage(`The partnership program allows you to set a minimum balance of another issued currency to be eligible for distribution.`)
        infoMessage(`You can set multiple different currencies and minimum balances.`)
        let numberOfIssuedCurrencies = await askForNumberMinMax(`How many different issued currencies would you like to partner with? (0: cancel)`,0,Number.MAX_SAFE_INTEGER)
        if(numberOfIssuedCurrencies===0) return lines
        else
        {
            let partnerAddresses=[]
            let ourAddresses = lines.map((line)=>{return line.account})
            partnerAddresses.push(ourAddresses)
            for(let i = 0; i<numberOfIssuedCurrencies;i++)
            {
                printBanner()
                let currencyCode = await askForTextInput(`What is the currency code of the issued currency?`)
                let currencyHex=(Buffer.from(currencyCode,'ascii').toString('hex').toUpperCase()).padEnd(40,'0');
                let issuerAddress = await askForTextInput(`What is the address of the issuer?`)
                let amount = await askForNumberMinMax(`What is the minimum $${currencyCode} balance?`,0,Number.MAX_SAFE_INTEGER)
                
                let partnerLines
                let partnerLinesResponse = await getAllTrustlinesToAnIssuer(networkRPC,issuerAddress)
                if(partnerLinesResponse.result === 'success') partnerLines = partnerLinesResponse.lines
                else {
                    infoMessage(`There was a problem retrieving the trustlines to the issuer.`)
                    if(await askYesNo(`Would you like to start the partnership program over again?`,true)) return await partnershipProgram(networkRPC,lines)
                    else return lines
                }
                let filteredLines = partnerLines.filter((line)=>{
                    if(line.currency===currencyHex)
                    {
                        return Number(line.balance)*-1>=Number(amount)
                    }
                })
                let filteredAddresses = filteredLines.map((line)=>{return line.account})
                infoMessage(`There are ${filteredAddresses.length} trustlines to ${issuerAddress} that meet the minimum balance requirement of ${amount} $${currencyCode}.`)
                await pressAnyKey()
                partnerAddresses.push(filteredAddresses);
            }
            let partners = partnerAddresses.reduce((a,b)=>a.filter(c=>b.includes(c)))
            infoMessage(`There are ${partners.length} trustlines in the partnership program that meet the criteria.`)
            await pressAnyKey()
            let filteredLines = lines.filter((line)=>{
                return partners.includes(line.account)
            })
            return filteredLines
        }
    }
    catch(err)
    {
        console.log(err)
    }
}

/**
 * @function specificTrustlineSettings
 * @description
 * Filters trustlines based on specific trustline settings (limit_peer, quality_in, quality_out). The user
 * can choose the trustline setting and the value for that setting.
 * 
 * @param {Array} lines - An array of trustlines.
 * @returns {Promise<Array>} - An array of filtered trustlines that meet the specific trustline setting criteria.
 * @throws {Error} - If there is a problem filtering specific trustline settings.
 */
export const specificTrustlineSettings = async (lines) => {
    try {
        let trustlineSetting = await askQuestion({type:'list',message:'What trustline settings would you like to use?',choices:['limit_peer','quality_in','quality_out']})
        let amount = await askForNumberMinMax(`What should the value of this setting be? (0: cancel)`,0,Number.MAX_SAFE_INTEGER)
        trustlineSetting!=='limit_peer'?amount=Number(amount):null;
        let filteredLines = lines.filter((line)=>{
            return line[trustlineSetting]===amount
        })
        infoMessage(`There are ${filteredLines.length} trustlines that meet the criteria.`)
        await pressAnyKey()
        if(filteredLines.length===0){
            if(await askYesNo(`Would you like to try again? If not specific trustline settings will not be used to filter.`,true)) return await specificTrustlineSettings(lines)
            else return lines
        }
        else return filteredLines
    }
    catch(err)
    {
        console.log('There was a problem filtering specific Trustline settings: ',err)
    }
}

/**
 * @function minXrpBalance
 * @description
 * Filters trustlines based on a minimum XRP balance. The user can set a minimum XRP balance for a
 * trustline to be eligible for distribution.
 * 
 * @param {Object} networkRPC - The network RPC object.
 * @param {Array} lines - An array of trustlines.
 * @returns {Promise<Array>} - An array of filtered trustlines that meet the minimum XRP balance requirement.
 * @throws {Error} - If there is an error checking balances.
 */
export const minXrpBalance = async (networkRPC,lines) => {
    try {
        // let addresses = lines.map((line)=>{return line.account})
        let minBalance= await askForNumberMinMax(`What is the minimum XRP balance? (0: cancel)`,0,Number.MAX_SAFE_INTEGER)
        
        let spinner = await createSpinner(`Checking balances... 0/${lines.length} checked`)
        await wait(10)
        let lineCounter = 0
        for await(let line of lines ){
            spinner.message(`Checking balances... ${lineCounter}/${lines.length} checked`)
            let balanceResult = await getXrpBalance(networkRPC,line.account,false);
            if(balanceResult.result==='success') line.xrpBalance=balanceResult.balance
            else
            {
                //TODO: HANDLE MIN XRP BALANCE RECHECK
                console.log('There was an error checking the balance of ',line.account)
                console.log(balanceResult)
                await pressAnyKey()
            }
            
            lineCounter++
            if(lineCounter!==0 && lineCounter%250===0)
            {
                spinner.stop()
                infoMessage(`Pausing for 60 seconds to avoid rate limiting...`)
                infoMessage(`Completed ${lineCounter} of ${lines.length} checks.`)
                await wait(60000)
                spinner.start()
            }
        }
        let filteredLines = lines.filter((line)=>{return Number(line.xrpBalance)>=Number(minBalance)})
        spinner.stop()
        infoMessage(`There are ${filteredLines.length} trustlines that meet the minimum XRP balance requirement.`)
        await pressAnyKey()
        return filteredLines
    }
    catch(err)
    {
        console.log('There was an error checking balances.',err)
    }
}

/**
 * @function nftOwnership
 * @description
 * Filters trustlines based on NFT ownership. NFT ownership allows the user to reward NFT holders with a
 * token distribution, while excluding those who do not hold the NFT. The user will need the NFT issuer and can specify
 * a collection by taxon.
 * 
 * @param {Object} networkRPC - The network RPC object.
 * @param {Array} lines - An array of trustlines.
 * @returns {Promise<Array>} - An array of filtered trustlines that satisfy the NFT requirement.
 * @throws {Error} - If there is an error checking NFT ownership.
 */
export const nftOwnership = async (networkRPC, lines) => {
    try 
    {
        infoMessage(`NFT ownership allows you to reward NFT holders with a token distribution, while excluding those who do not hold the NFT.`)
        infoMessage(`You will need the NFT issuer and can specify a collection by taxon.`)
        let nftIssuer = await askForTextInput(`What is the NFT issuer address?`)
        let tokenTaxon = await askForNumberMinMax(`What is the token taxon? (-1: All NFTs by an issuer)`,-1,Number.MAX_SAFE_INTEGER)
        let multipleNFTRewards = await askYesNo(`Should recipients receive multiple distributions for each valid NFT?`,false)

        let spinner = await createSpinner(`Checking account nfts... 0/${lines.length} accounts checked`)
        // await wait(10)
        let lineCounter = 0
        for await(let line of lines ){
            spinner.message(`Checking NFTs of account... ${lineCounter}/${lines.length} checked`)
            let accountNFTs = await getAccountNFTs(networkRPC,line.account);
            if(accountNFTs.result === 'success')
            {
               
                let ownedIssuerNFTs = accountNFTs.nfts.filter((nft)=>(nft.Issuer === nftIssuer && (Number(tokenTaxon) === -1 || Number(nft.NFTokenTaxon) === Number(tokenTaxon))))
                line.nftsOwned=ownedIssuerNFTs
                line.multipleNFTRewards=multipleNFTRewards
            }
            else
            {
                console.log('There was an error checking the NFTs of ',line.account)
                console.log(accountNFTs)
                await pressAnyKey()
            }
            lineCounter++
            if(lineCounter!==0 && lineCounter%150===0)
            {
                spinner.stop()
                infoMessage(`Pausing for 60 seconds to avoid rate limiting...`)
                infoMessage(`Completed ${lineCounter} of ${lines.length} checks.`)
                await wait(60000)
                spinner.start()
            }
            
        }
        let filteredLines = lines.filter((line)=>{return Number(line.nftsOwned.length>0)})
        spinner.stop()
        infoMessage(`There are ${filteredLines.length} trustlines that satisfy the NFT requirement.`)
        await pressAnyKey()
        return filteredLines
        
    }
    catch(err)
    {   
        console.log('There was an error checking NFT ownership.',err)
    }
}