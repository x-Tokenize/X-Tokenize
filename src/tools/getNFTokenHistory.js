import xrpl from 'xrpl'
import { configHandler } from '../config/configHandler.js'
import { askForTextInput, createSpinner, errorMessage, fancyMessage, infoMessage, pressAnyKey, printResponse, successMessage, wait, warningMessage } from '../utils/index.js'
import { getAccountTransactions, getNFTokenIdFromTx,getAccountNFTs, submitRequest} from '../xrpl/index.js'

export const getMintedNFTokensFromMeta = (meta)=>{

    let MintedNFTokensNode = meta.AffectedNodes.filter(node=>node.ModifiedNode?.FinalFields?.MintedNFTokens )
    return MintedNFTokensNode[0].ModifiedNode.FinalFields.MintedNFTokens
}



export const findMintingTx = async(networkRPC,nftokenID)=>{
    try{
        let {NFTokenID,Flags,TransferFee,Issuer,Taxon,Sequence} = xrpl.parseNFTokenID(nftokenID)

        let startledger = 0;
        let nftFound = false;
        do
        {
            let accountTxs= await submitRequest({method:'account_tx',params:[{account:Issuer,limit:200,forward:true,ledger_index_min:startledger}]},networkRPC)
            let mints = accountTxs.transactions.filter(tx=>tx.tx.TransactionType === 'NFTokenMint')
            let minting = mints.length>0?true:false
            for (const mint of mints) {
                let calculatedNFTokenID = getNFTokenIdFromTx(mint)
                if(calculatedNFTokenID === nftokenID)
                {
                    nftFound = true;
                    return {result:'success',message:'Successfully found the minting transaction.',transaction:mint}
                }
               
            }
            console.log(`NFT found: ${nftFound} - Start ledger: ${startledger} - Last ledger: ${accountTxs.transactions[accountTxs.transactions.length-1].tx.inLedger}`)
            startledger = accountTxs.transactions[accountTxs.transactions.length-1].tx.inLedger
            if(minting)
            {
                let mintedNFTokens = getMintedNFTokensFromMeta(mints[mints.length-1].meta)
                console.log(`Minted NFTokens: ${mintedNFTokens} - Sequence: ${Sequence}`)
         
            } 
        }while(nftFound === false)
        
    }
    catch(err)
    {
        console.log('THere was a problem finding the minting transaction: ',err)
    }
}

// export const findOfferCreate = async(networkRPC,nftokenID,ledgerMin)=>{
//     try{
//         let {NFTokenID,Flags,TransferFee,Issuer,Taxon,Sequence} = xrpl.parseNFTokenID(nftokenID)

//         let startledger = ledgerMin;
//         let offerFound = false;
//         do
//         {
//             let accountTxs= await submitRequest({method:'account_tx',params:[{account:Issuer,limit:200,forward:true,ledger_index_min:startledger}]},networkRPC)
//             let offers = accountTxs.filter(transaction=>(transaction.tx.TransactionType==='NFTokenCreateOffer' && transaction.meta.TransactionResult ==='tesSUCCESS' && transaction.tx.NFTokenID===nftokenID))            let offering = offers.length>0?true:false
           
//         }while(nftFound === false)
        
//     }
//     catch(err)
//     {
//         console.log('THere was a problem finding the minting transaction: ',err)
//     }
// }




export const getNFTokenHistory = async()=>{
    fancyMessage(`Coming Soon!`)
    return {result:'success',message:''}
}

export const getNFTokenHistoryz = async()=>{
    try
    {
        let settings = await configHandler.getConfigs('XTOKENIZE_SETTINGS')
        let networkRPC = settings.networkRPC
        let nftokenID='00081B58E2E050A72D3C0E44193986521A6880F43BDA1AA09FA8A72400000D9C'
        // let nftokenID = await askForTextInput(`Please enter the NFT ID you would like to get the ownership history for:`)
        let {NFTokenID,Flags,TransferFee,Issuer,Taxon,Sequence} = xrpl.parseNFTokenID(nftokenID)

        
        await pressAnyKey()
        let ownerHistory = {
            nft:nftokenID,
            issuer:Issuer,
            minter:null,
            currentOwner:null,
            numberOfOwners:0,
            ownershipChanges:[]
        }

        //let mintTx= await findMintingTx(networkRPC,nftokenID)
        let mintTx = {
            result: 'success',
            message: 'Successfully found the minting transaction.',
            transaction: {
              meta: {
                AffectedNodes: [Array],
                TransactionIndex: 22,
                TransactionResult: 'tesSUCCESS'
              },
              tx: {
                Account: 'rMgcSs3HQjvy3ZM2FVsxqgUrudVPM7HP5m',
                Fee: '3200',
                Flags: 8,
                LastLedgerSequence: 76573296,
                Memos: [Array],
                NFTokenTaxon: 54291,
                Sequence: 76546322,
                Signers: [Array],
                SigningPubKey: '',
                TransactionType: 'NFTokenMint',
                TransferFee: 7000,
                date: 724843121,
                hash: '68E6657FE908E1B14CD2A3F7150FB5CAE4F7FB18F314FE29F700D9928F6AF8C4',
                inLedger: 76553294,
                ledger_index: 76553294
              },
              validated: true
            }
          }
        console.log(mintTx)
        if(mintTx.result === 'success')
        {
            let transaction= mintTx.transaction
            ownerHistory.minter = transaction.tx.Issuer?transaction.tx.Issuer:transaction.tx.Account
            ownerHistory.currentOwner = transaction.tx.Account
            ownerHistory.numberOfOwners = 1
            ownerHistory.ownershipChanges.push(
                {
                    type:'mint',
                    issuer:Issuer,
                    minter:ownerHistory.minter,
                    owner:ownerHistory.currentOwner,
                    timestamp:transaction.tx.date,
                    ledger:transaction.tx.inLedger,
                    tx:transaction.mintTx
                })
        }
        else return {result:'failed',message:'Failed to find the minting transaction.'}
        

        let moreHistory = true
        let currentOperation='AccountTx'
        let currentTransactionSearch = 'NFTokenCreateOffer'
        let nftOffers = []
        
        let currentAccount=Issuer
        let lastTransactionLedger = mintTx.transaction.tx.inLedger;

        let transactionsRetrieved ={}
        infoMessage(`Getting the ownership history for NFT ${nftokenID}... This can take a while depending on the number of transactions of the originating account.`)
        // console.log()

        //let spinner = await createSpinner(`Getting NFToken History for NFT ${nftokenID}... `)
        do{
           // spinner.message(`Getting NFToken History for NFT ${nftokenID}... Current Operation:                               `)
            //spinner.message(`Getting NFToken History for NFT ${nftokenID}... Current Operation: ${currentOperation}`)
            switch(currentOperation)
            {
                case 'AccountTx':
                    {
                         infoMessage(`Getting the transactions for account ${currentAccount}...`)
                        // console.log()
                        let accountTxOptions ={forward:true}
                        if(lastTransactionLedger>0) accountTxOptions.ledger_index_min = lastTransactionLedger
                        let accountTx
                        // if(transactionsRetrieved[currentAccount]) accountTx = transactionsRetrieved[currentAccount]
                        // else{
                            accountTx = await getAccountTransactions(networkRPC,currentAccount,{forward:true,ledger_index_min:lastTransactionLedger,limit:200})
                        //    transactionsRetrieved[currentAccount] = accountTx
                        //}
                        
                        
                        if(accountTx.result === 'success')
                        {
                            printResponse(accountTx)
                            // console.log()
                            let {transactions} = accountTx
                            switch(currentTransactionSearch)
                            {
                                case 'NFTokenMint':
                                    {
                                         infoMessage(`Looking for the NFTokenMint tx associated with NFT ${nftokenID}...`)
                                        // console.log()
                                        let mintTransactions = transactions.filter(transaction=>(transaction.tx.TransactionType==='NFTokenMint' && transaction.meta.TransactionResult ==='tesSUCCESS'))
                                        if(mintTransactions.length>0)
                                        {
                                            let mintTx
                                            for(let i = 0; i<mintTransactions.length;i++)
                                            {
                                                mintTx = mintTransactions[i]
                                                let mintedNFTokenID = getNFTokenIdFromTx(mintTx)
                                                if(mintedNFTokenID===nftokenID) break;
                                            }
                                            if(mintTx)
                                            {
                                                 successMessage(`Found the NFTokenMint tx associated with NFT ${nftokenID}!`)
                                                // console.log()

                                                if(mintTx.tx.Account===Issuer)
                                                {
                                                     successMessage(`The NFT ${nftokenID} was minted by the issuer!`)
                                                    // console.log()
                                                    ownerHistory.minter = Issuer
                                                    ownerHistory.numberOfOwners++

                                                    ownerHistory.ownershipChanges.push({type:'mint',issuer:Issuer,minter:Issuer,owner:Issuer,tx:mintTx})
                                                
                                                }
                                                else
                                                {
                                                    successMessage(`The NFT ${nftokenID} was minted by an authorized minter: ${mintTx.tx.Account}`)
                                                    // console.log()
                                                    ownerHistory.minter = mintTx.tx.Account
                                                    ownerHistory.numberOfOwners++
                                                    ownerHistory.ownershipChanges.push({type:'mint',issuer:Issuer,minter:mintTx.tx.Account,owner:mintTx.tx.Account,tx:mintTx})
                                                }
                                                    currentAccount=ownerHistory.minter
                                                    currentOperation ='AccountNFTs'
                                                    lastTransactionLedger = mintTx.tx.inLedger
                                            }
                                            else
                                            {
                                                moreHistory=false
                                                 warningMessage(`Could not find the NFTokenMint tx associated with NFT ${nftokenID}!`)
                                                // console.log()

                                            }
                                        }
                                        else {
                                            moreHistory=false
                                             warningMessage(`No mint txs found for account ${currentAccount}!`)
                                            // console.log()

                                           
                                        }
                                        break;
                                    }
                                case 'NFTokenCreateOffer':
                                    {
                                         infoMessage(`Looking for the NFTokenCreateOffer tx associated with NFT ${nftokenID} on account ${currentAccount}...`)
                                        // console.log()

                                        let createOfferTxs = transactions.filter(transaction=>(transaction.tx.TransactionType==='NFTokenCreateOffer' && transaction.meta.TransactionResult ==='tesSUCCESS' && transaction.tx.NFTokenID===nftokenID))
                                        if(createOfferTxs.length>0)
                                        {
                                             infoMessage(`Found ${createOfferTxs.length} NFTokenCreateOffer txs associated with NFT ${nftokenID}!`)
                                            for(let i = 0; i<createOfferTxs.length;i++)
                                            {
                                                 console.log(`Found a created offer for NFT ${nftokenID} on account ${createOfferTxs[i].tx.Account}!`)
                                                let offerNode = createOfferTxs[i].meta.AffectedNodes.find(affectedNode=>affectedNode.CreatedNode && affectedNode.CreatedNode.LedgerEntryType==='NFTokenOffer')
                                                // console.log(offerNode)
                                                let offer = {
                                                    type:offerNode.CreatedNode.NewFields.Flags===1?'sell':'buy',
                                                    account:createOfferTxs[i].tx.Account,
                                                    offerID:offerNode.CreatedNode.LedgerIndex,
                                                    amount: createOfferTxs[i].tx.Amount?createOfferTxs[i].tx.Amount:null,
                                                    destination:offerNode.CreatedNode.NewFields.Destination?offerNode.CreatedNode.NewFields.Destination:null,
                                                    offerOwner:offerNode.CreatedNode.NewFields.Owner,
                                                }
                                                if(createOfferTxs[i].tx.inLedger>lastTransactionLedger) lastTransactionLedger = createOfferTxs[i].tx.inLedger
                                                nftOffers.push(offer)
                                            }
                                            // console.log()
                                            currentOperation = 'AccountTx'
                                            currentTransactionSearch = 'NFTokenAcceptOffer'
                                        }
                                        else
                                        {
                                            lastTransactionLedger = transactions[transactions.length-1].tx.inLedger
                                            console.log(lastTransactionLedger)
                                            await pressAnyKey()
                                            // warningMessage(`No NFTokenCreateOffer txs found for account ${currentAccount} associated with the NFT!`)
                                            //moreHistory = false
                                            // await pressAnyKey()
                                        }
                                        break;
                                    }
                                case `NFTokenAcceptOffer`:
                                    {
                                         infoMessage(`Looking for the NFTokenAcceptOffer tx associated with NFT ${nftokenID} on account ${currentAccount}...`)
                                        // console.log()
                                        let currentOfferIDs = nftOffers.map(offer=>offer.offerID)
                                        let acceptedOffers = transactions.filter(transaction=>(
                                            transaction.tx.TransactionType==='NFTokenAcceptOffer' && 
                                            transaction.meta.TransactionResult ==='tesSUCCESS' &&
                                            (currentOfferIDs.includes(transaction.tx.NFTokenBuyOffer) || currentOfferIDs.includes(transaction.tx.NFTokenSellOffer))
                                            ))

                                        if(acceptedOffers.length>0)
                                        {
                                            let acceptedOffer = acceptedOffers[0]
                                            if(acceptedOffer.tx.inLedger>lastTransactionLedger) lastTransactionLedger = acceptedOffer.tx.inLedger

                                            let ownershipChange = {
                                                type:'ownershipChange',
                                                currency:null,
                                                currencyIssuer:null,
                                                hex:null,
                                                amount:null,
                                                from:currentAccount,
                                                to:null,
                                                sellOffer:null,
                                                buyOffer:null,
                                                acceptOfferTx:acceptedOffer,
                                            }

                                             infoMessage(`Found an NFTokenAcceptOffer tx associated with NFT ${nftokenID}!`)
                                            // console.log()
                                            //console.log(acceptedOffer)
                                            if(acceptedOffer.tx.NFTokenBrokerFee || (acceptedOffer.tx.NFTokenBuyOffer && acceptedOffer.tx.NFTokenSellOffer))
                                            {
                                               
                                                 infoMessage(`We have a brokered offer!`)
                                                let buyOffer = nftOffers.find(offer=>offer.offerID===acceptedOffer.tx.NFTokenBuyOffer)
                                                let sellOffer = nftOffers.find(offer=>offer.offerID===acceptedOffer.tx.NFTokenSellOffer)
                                                ownershipChange.buyOffer=buyOffer
                                                ownershipChange.sellOffer=sellOffer
                                                // await pressAnyKey()
                                                console.log(buyOffer)
                                                console.log(sellOffer)

                                                ownershipChange.to = buyOffer.offerOwner
                                                currentAccount = buyOffer.offerOwner
                                                currentOperation = 'AccountNFTs'
                                                if(typeof sellOffer.amount ==='string')
                                                {
                                                     infoMessage(`It's an XRP transaction...`)
                                                    ownershipChange.currency='XRP'
                                                    if(acceptedOffer.tx.NFTokenBrokerFee && Number(acceptedOffer.tx.NFTokenBrokerFee)>0)
                                                    {
                                                         infoMessage(`There's a broker fee!`)
                                                        ownershipChange.amount=Number(buyOffer.amount)-Number(acceptedOffer.tx.NFTokenBrokerFee)
                                                        ownershipChange.brokerFee=Number(acceptedOffer.tx.NFTokenBrokerFee)
                                                        ownershipChange.broker=acceptedOffer.tx.Account
                                                        // infoMessage(`The broker fee is ${ownershipChange.amount} XRP!`)
                                                        // await pressAnyKey()
                                                    }
                                                    else
                                                    {
                                                         infoMessage(`There was no broker fee...`)
                                                        ownershipChange.amount=Number(buyOffer.amount)
                                                        ownershipChange.brokerFee = 0
                                                        ownershipChange.broker = acceptedOffer.tx.Account

                                                    }
                                                }
                                                else
                                                {
                                                     infoMessage(`It's an IC transaction...`)
                                                    ownershipChange.currency=xrpl.convertHexToString(sellOffer.amount.currency.replace(/0+$/,''))
                                                    ownershipChange.currencyIssuer=sellOffer.amount.issuer
                                                    ownershipChange.hex=sellOffer.amount.currency
                                                    if(acceptedOffer.tx.NFTokenBrokerFee && Number(acceptedOffer.tx.NFTokenBrokerFee)>0)
                                                    {
                                                         infoMessage(`There's a broker fee!`)
                                                        ownershipChange.amount=Number(buyOffer.amount.value)-Number(acceptedOffer.tx.NFTokenBrokerFee.value)
                                                        ownershipChange.brokerFee=Number(acceptedOffer.tx.NFTokenBrokerFee.value)
                                                        ownershipChange.broker=acceptedOffer.tx.Account
                                                         infoMessage(`The broker fee is ${ownershipChange.amount} ${ownershipChange.currency}!`)
                                                        // await pressAnyKey()
                                                    }
                                                    else
                                                    {
                                                         infoMessage(`There was no broker fee...`)
                                                        ownershipChange.amount=Number(buyOffer.amount)
                                                        ownershipChange.brokerFee = 0
                                                        ownershipChange.broker = acceptedOffer.tx.Account

                                                    }
                                                }
                                                if(ownershipChange.to!==null)
                                                {
                                                    ownerHistory.numberOfOwners++
                                                    ownerHistory.ownershipChanges.push(ownershipChange)
                                                    ownerHistory.currentOwner = ownershipChange.to

                                                }
                                            }
                                            else
                                            {
                                                 infoMessage(`This is a direct offer!`)
                                                // console.log(acceptedOffer)
                                                let offer = nftOffers.find(offer=>offer.offerID===acceptedOffer.tx.NFTokenBuyOffer || offer.offerID===acceptedOffer.tx.NFTokenSellOffer)
                                                // console.log(offer)
                                                let ownershipChange = {
                                                    type:'ownershipChange',
                                                    currency:null,
                                                    hex:null,
                                                    amount:null,
                                                    from:currentAccount,
                                                    to:null
                                                }
                                                if(typeof offer.amount ==='string')
                                                {
                                                     infoMessage(`This is an XRP tx...`)
                                                    ownershipChange.currency='XRP'
                                                    ownershipChange.amount=offer.amount
                                                }
                                                else
                                                {
                                                     infoMessage(`This is an IC tx...`)
                                                    ownershipChange.currency=xrpl.convertHexToString(offer.amount.currency.replace(/0+$/,''))
                                                    ownershipChange.hex=offer.amount.currency
                                                    ownershipChange.currencyIssuer=offer.amount.issuer

                                                    ownershipChange.amount=offer.amount.value
                                                }
                                                if(offer.destination)
                                                {
                                                     infoMessage(`The accepted offer has a destination!`)
                                                    ownershipChange.to=offer.destination
                                                    ownerHistory.ownershipChanges.push(ownershipChange)
                                                    currentAccount = offer.destination
                                                    currentOperation = 'AccountNFTs'
                                                }
                                                else if(offer.type==='buy')
                                                {
                                                     infoMessage(`The offer accepted was a buy offer...`)
                                                    ownershipChange.to=offer.Owner
                                                    ownershipChange.buyOffer=offer
                                                    currentAccount = offer.Owner
                                                    currentOperation = 'AccountNFTs'
                                                    //Check offer owner
                                                }
                                                else if(offer.type==='sell')
                                                {
                                                     infoMessage(`The offer accepted was a sell offer...`)
                                                    ownershipChange.to=acceptedOffer.tx.Account
                                                    ownershipChange.sellOffer=offer
                                                    currentAccount = acceptedOffer.tx.Account
                                                    currentOperation = 'AccountNFTs'
                                                    //Check the account that accepted the offer.
                                                }
                                                else
                                                {
                                                     warningMessage(`Something went wrong...`)
                                                    moreHistory = false
                                                }
                                                if(ownershipChange.to!==null)
                                                {
                                                    ownerHistory.numberOfOwners++
                                                    ownerHistory.ownershipChanges.push(ownershipChange)
                                                    ownerHistory.currentOwner = ownershipChange.to
                                                }
                                            }
                                               
                                        }
                                        else
                                        {
                                            infoMessage(`No NFTokenAcceptOffer txs found...`)
                                            // console.log()
                                            moreHistory = false
                                            // await pressAnyKey()
                                        }
                                        break;
                                    }
                                          
                            }
                        }
                        else
                        {
                             warningMessage(`Failed to get account Transactions`)
                            moreHistory = false
                            // await pressAnyKey()
                        }
                        break;
                    }
                case 'AccountNFTs':
                    {
                        // infoMessage(`Checking if ${currentAccount} currently owns the NFT ${nftokenID}...`)
                        let accountNFTs = await getAccountNFTs(networkRPC,currentAccount)
                        if(accountNFTs.result === 'success')
                        {
                            // printResponse(accountNFTs)
                            // console.log()
                            let {nfts} = accountNFTs
                            if(nfts.length>0)
                            {
                                let nft = nfts.find(nft=>nft.NFTokenID===nftokenID)
                                if(nft)
                                {
                                    // console.log(`The account ${currentAccount} currently owns the NFT ${nftokenID}`)
                                    // console.log()
                                    moreHistory = false
                                }
                                else
                                {
                                    // infoMessage(`The account does not own the NFT ${nftokenID}`)
                                    // console.log()
                                    currentOperation='AccountTx'
                                    currentTransactionSearch='NFTokenCreateOffer'
                                }
                            }
                            else
                            {
                                // warningMessage(`The account ${currentAccount} does not own any NFTs!`)
                                // console.log()
                                currentOperation='AccountTx'
                                currentTransactionSearch='NFTokenCreateOffer'
                            }
                           
                            
                        }
                        else
                        {
                            // errorMessage(`Failed to get account nfts...`)
                        }
                        break;
                    }
            }
        }while(moreHistory)
        spinner.stop()
        console.log(ownerHistory)
        await pressAnyKey()
        return true
    }
    catch(err)
    {
        console.log('There was a problem getting the NFT history: ',err)
    }
}