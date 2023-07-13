
/**
 * 
 * @typedef {string} NFT - Represents an NFT.
 */

/**
 * @typedef {object} Line - Represents a trustline.
 * @property {string} account - The account address of the trustline.
 * @property {string} balance - The balance of the trustline.
 * @property {string} currency - The currency of the trustline.
 * @property {string} [limit] - The limit of the trustline.
 * @property {string} [limit_peer] - The limit peer of the trustline.
 * @property {string} [quality_in] - The quality in of the trustline.
 * @property {string} [quality_out] - The quality out of the trustline.
 * @property {string} [no_ripple] - The no ripple flag of the trustline.
 * @property {string} [no_ripple_peer] - The no ripple peer flag of the trustline.
 * @property {string} [authorized] - The authorized flag of the trustline.
 * @property {string} [freeze] - The freeze flag of the trustline.
 * 
 */

/**
 * @typedef {Object} FailedOperationResult
 * @property {"failed"|"warn"|"error"} result - The result of the operation.
 * @property {string} message - The message associated with the result.
 * 
 */


/**
 * @typedef {"mainnet"|"testnet"|"altnet"} Network
 */

/**
 * @typedef {string} NetworkRPC - The RPC endpoint of the network.
 */

/**
 * @typedef {Object} Wallet
 * @property {string} address =The address of the wallet
 * @property {string} seed - The seed of the wallet if applicable to the wallet type.
 * @property {boolean} seedEncrypted - Whether or not the seed is encrypted.
 * @property {"Ledger Nano S/X" | "XUMM"} [externalWallet] - The type of external wallet if applicable.
 * @property {string} [userToken] - The user token of the xumm wallet being used.
 * @property {path} [path] - The bip32 path of the wallet if using Ledger Nano.
 * @property {publicKey} [publicKey] - The public key of the wallet if using Ledger Nano.
 * @property {name} [name] - The name of the wallet if setup in settings.
 * 
 */

/**
 * @typedef {Object} OperationResult
 * @property {"success"|"failed"|"warn"|"error"} result - The result of the operation.
 * @property {string} message - The message associated with the result.
 */



//CONFIGS 

/**
 * @typedef {Object} ConfigCreationResult - The result of creating aconfiguration.
 * @property {"success"|"warn"|"error"} result - The result of the operation.
 * @property {string} message - The message associated with the result.
 * @property {IssuedCurrencyConfig | ICDistributionConfig | NFTMetadataConfig | NFTConfig | NFTMintConfig | NFTDistributionConfig} [config] - The created configuration.
 */

/**
 * @typedef {Object} IssuedCurrencyConfig - The configuration of an issued currency.
 * @property {string} name - The name of the issued currency configuration.
 * @property {Network} network - The name of the network the issued currency will be created on.
 * @property {NetworkRPC} networkRPC - The RPC endpoint of the network the issued currency will be created on.
 * @property {Wallet} issuer - The wallet configuration of the issuer.
 * @property {Wallet} treasury - The wallet configuration of the treasury.
 * @property {Wallet} operational - The wallet configuration of the operational wallet.
 * @property {string} currencyCode - The currency code of the issued currency.
 * @property {string} currencyHex - The currency hex of the issued currency.
 * @property {boolean} fixedSupply - Whether or not the issued currency will have a fixed supply.
 * @property {number} totalSupply - The total supply of the issued currency.
 * @property {number} circulatingSupply - The circulating supply of the issued currency.
 * @property {boolean} isMinted - Whether or not the issued currency is minted.
 */
/**
 * @typedef {Object} CurrencyConfigResult
 * @property {"success"|"warn"|"error"} result - The result of the operation.
 * @property {string} message - The message associated with the result.
 * @property {string} [currencyCode] - The currency code of the issued currency.
 * @property {string} [currencyHex] - The currency hex of the issued currency.
 * @property {boolean} [fixedSupply] - Whether or not the issued currency will have a fixed supply.
 * @property {number} [totalSupply] - The total supply of the issued currency.
 * @property {number} [circulatingSupply] - The circulating supply of the issued currency.
 * @property {boolean} [isMinted] - Whether or not the issued currency is minted.
 * 
 */

/**
 * @typedef {Object} IssuedCurrencyWalletCreationResult
 * @property {"success"|"warn"|"error"} result - The result of the operation.
 * @property {string} message - The message associated with the result.
 * @property {Wallet} [issuer] - The wallet object containing the issuers wallet configuration.
 * @property {Wallet} [treasury] - The wallet object containing the treasury wallet configuration.
 * @property {Wallet} [operational] - The wallet object containing the operational wallet configuration.
 */

/**
 * @typedef {Object} CreateLinesForDistributionResult - The result of creating lines for a distribution.
 * @property {"success"|"warn"|"error"} result - The result of the operation.
 * @property {string} message - The message associated with the result.
 * @property {ICDistributionLine[]} [lines] - The lines created for the distribution.
 */

/**
 * @typedef {Object} ICDistributionLine
 * @property {string} account - The account address of the trustline.
 * @property {string} amount - The amount of the distribution.
 * @property {string} balance - The balance of the trustline.
 * @property {string} [xrpBalance] - The xrp balance of the trustline.
 * @property {string} [nftsOwned] - The nfts owned of the trustline.
 * @property {boolean} limitExceeded - Whether or not the trustline limit is exceeded.
 * @property {'pending' | 'sent' | 'verified' | 'failed'} status - The status of the distribution.
 * @property {string} [txHash] - The transaction hash of the distribution.
 * @property {string} [preliminaryResult] - The preliminary result of the distribution.
 * @property {string} [finalResult] - The final result of this lines distribution.
 * @property {string} [ledgerIndex] - The ledger index of this lines  distribution.
 */

/**
 * @typedef {Object} ICDistributionConfig
 * @property {string} name - The name of the distribution configuration.
 * @property {string} projectName - The name of the project the distribution is for.
 * @property {"pending" | "active" | "pendingVerification" | "completed"} status - The status of the IC distribution.
 * @property {string} timeCreated - The time the distribution was created in ISO format.
 * @property {number} numElligibleLines - The number of ellgible lines for the distribution.
 * @property {string} amount - The amount of the issued currency to be distributed as a string.
 * @property {string} currencyCode - The currency code of the issued currency to be distributed.
 * @property {string} currencyHex - The currency hex of the issued currency to be distributed.
 * @property {Wallet} distributionWallet - The wallet configuration of the distribution wallet.
 * @property {string} ledgerIndexStart - The ledger index to start the distribution at.
 * @property {string} ledgerIndexEnd - The ledger index to end the distribution at.
 * @property {number} successfulDistributions - The number of successful distributions.
 * @property {number} failedDistributions - The number of failed distributions.
 * @property {ICDistributionLine[]} lines - The elligible lines for the distribution.
 */


/**
 * @typedef {Object} AwsAPIKeys - The AWS API keys.
 * @property {string} key - The AWS access key id.
 * @property {string} secret - The AWS secret access key.
 * @property {string} region - The AWS region.
 * @property {string} bucket - The AWS bucket.
 * @property {boolean} [secretEncrypted] - Whether or not the secret is encrypted.
 */

/**
 * @typedef {Object} PinataAPIKeys - The Pinata API keys.
 * @property {string} key - The Pinata API key.
 * @property {string} secret - The Pinata secret API key.
 * @property {boolean} [secretEncrypted] - Whether or not the secret is encrypted.
 */


/**
 * @typedef {Object} NFTMetadataDeploymentItem - An NFT metadata deployment item.
 * @property {string} file - The file of the NFT metadata deployment item.
 * @property {string} fileName - The file name of the NFT metadata deployment item.
 * @property { "pending" | "failed"} status - The status of the NFT metadata deployment item.
 * @property {boolean} attachedToMint - Whether or not the NFT metadata deployment item is attached to a mint.
 * @property {string} mintName - The name of the mint the NFT metadata deployment item is attached to.
 * @property {boolean} deployed - Whether or not the NFT metadata deployment item is deployed.
 * @property {string} uri - The URI of the NFT metadata deployment item.
 * @property {any} additionalDeployments - The items within the metadata that require additional deployment.
 * @property {any} [metadata] - The metadata of the NFT metadata deployment item.
 */

/**
 * @typedef {Object} NFTMetadataConfig - An NFT metadata configuration.
 * @property {string} name - The name of the NFT metadata configuration.
 * @property {string} projectName - The name of the project the NFT metadata is for.
 * @property {"IPFS (pinata)" | "AWS S3" | null} deploymentType - The type of deployment for the NFT metadata.
 * @property {AwsAPIKeys | PinataAPIKeys} apiKeys - The api keys for the deployment type.
 * @property {string} directory - The directory of the NFT metadata.
 * @property {"deployed" | "pending" | "failed"} status - The status of the NFT metadata.
 * @property {Array<{property: string, fileType: string}>} additionalDeployments - The additional deployments of the NFT metadata.
 * @property {number} numDeploymentItems - The number of items to be deployed.
 * @property {NFTMetadataDeploymentItem[]} items - The metadata items to handle or process.
 */


/**
 * @typedef {Object} NFTConfig - An NFT configuration.
 * @property {string} name - The name of the NFT configuration.
 * @property {Network} network - The network of the NFT configuration.
 * @property {NetworkRPC} networkRPC - The network RPC of the NFT configuration.
 * @property {Wallet} minter - The minter of the NFT configuration.
 * @property {boolean} authorizedMinting - Whether or not the NFT configuration is authorized for minting.
 * @property {Wallet} [authorizedMinter] - The authorized minter of the NFT configuration.
 */

/**
 * @typedef {Object} NFTMintItem - An NFT mint Item.
 * @property {number} id - The id of the NFT mint item.
 * @property {string} file - The file of the NFT mint item.
 * @property {string} uri - The URI of the NFT mint item.
 * @property {"pending" | "verified" | "failed"} status - The status of the NFT mint item.
 * @property {boolean} minted - Whether or not the NFT mint item has been minted.
 * @property {boolean} attachedToDistribution - Whether or not the NFT mint item is attached to a distribution.
 * @property {string} [distributionName] - The name of the distribution the NFT mint item is attached to.
 * @property {string} [nftokenID] - The NFT token ID of the NFT mint item.
 * @property {string} [txHash] - The transaction hash of the NFT mint item.
 * @property {string} [preliminaryResult] - The preliminary result of the NFT mint item.
 * @property {string} [finalResult] - The final result of the NFT mint item.
 * @property {number} [ledgerIndex] - The ledger index of the NFT mint item.
 */

/**
 * @typedef {Object} NFTMintConfig - An NFT mint configuration.
 * @property {string} name - The name of the NFT mint configuration.
 * @property {string} projectName - The name of the project the NFT mint is for.
 * @property {"pending" | "active" | "pendingVerification" | "completed"} status - The status of the NFT mint.
 * @property {string} timeCreated - The time the mint was created in ISO format.
 * @property {boolean} transferable - Whether or not the minted NFTs should be transferable.
 * @property {number} transferFee - The transfer fee of the minted NFTs.
 * @property {boolean} onlyXRP - Whether or not the minted NFTs should only be able to be purchased with XRP.
 * @property {boolean} burnable - Whether or not the minted NFTs should be burnable by the minting account.
 * @property {string} tokenTaxon - The token taxon of the minted NFTs.
 * @property {string} ledgerIndexStart - The ledger index to start the mint at.
 * @property {string} ledgerIndexEnd - The ledger index to end the mint at.
 * @property {number} successfullMints - The number of successful mints.
 * @property {number} failedMints - The number of failed mints.
 * @property {string} selectedDeployment - The selected metadata deployment for the mint.
 * @property {NFTMintItem[]} items - The items to mint.
 * 
 */

/**
 * @typedef {Object} NFTDistributionCurrency - An NFT distribution accepted currency.
 * @property {"XRP" | "IC"} type - The type of the currency.
 * @property {string} [code] - The code of the currency.
 * @property {string} [hex] - The hex of the currency.
 * @property {string} [issuer] - The issuer of the currency.
 * @property {string} amount - The amount of the currency.
 */
/**
 * @typedef {Object} NFTDistributionNFT - An NFT distribution NFT.
 * @property {string} id - The id of the NFT.
 * @property {'pending' | 'purchased' | 'offer-sent' | 'offer-created' | 'offer-accepted' | 'failed'} status - The status of the NFT.
 * @property {string} nftokenID - The NFT token ID of the NFT.
 * @property {string} [file] - The file of the NFT.
 * @property {string} [uri] - The URI of the NFT.
 * @property {Object} [offer] - The offer of the NFT.
 * @property {string} [offer.offerID] - The ledger node of the created offer.
 * @property {string} [offer.destination] - The destination of the created offer.
 * @property {string} [offer.txHash] - The transaction hash of the created offer.
 * @property {string} [offer.preliminaryTxResult] - The preliminary transaction result of the created offer.
 * @property {string} [offer.finalTxResult] - The final transaction result of the created offer.
 * @property {number} [offer.ledgerIndex] - The ledger index of the created offer.
 * @property {Object} [acceptOffer] - The accept offer of the NFT.
 * @property {string} [acceptOffer.address] - The address of the accepted offer.
 * @property {string} [acceptOffer.txHash] - The transaction hash of the accepted offer.
 * @property {string} [acceptOffer.finalTxResult] - The final transaction result of the accepted offer.
 * @property {number} [acceptOffer.ledgerIndex] - The ledger index of the accepted offer.
 * @property {Object} [purchase] - The purchase of the NFT.
 * @property {string} [purchase.address] - The address of the purchased NFT.
 * @property {string} [purchase.txHash] - The transaction hash of the purchased NFT.
 * @property {string} [purchase.finalTxResult] - The final transaction result of the purchased NFT.
 * @property {number} [purchase.ledgerIndex] - The ledger index of the purchased NFT.
 */


/**
 * @typedef {Object} NFTDistributionConfig - An NFT distribution configuration.
 * @property {string} name - The name of the NFT distribution configuration.
 * @property {string} projectName - The name of the project the NFT distribution is for.
 * @property {"created" | "pending" | "active" | "pendingVerification" | "completed"} status - The status of the NFT distribution.
 * @property {string} timeCreated - The time the distribution was created in ISO format.
 * @property {string} ledgerIndexStart - The ledger index to start the distribution at.
 * @property {string} ledgerIndexEnd - The ledger index to end the distribution at.
 * @property {string} lastHandledLedgerIndex - The last handled ledger index of the distribution.
 * @property {number} numberOfNFTs - The number of NFTs in the distribution.
 * @property {'Simple Distribution' | 'On-Demand Distribution' | 'Trustline Distribution'} distributionType - The type of the distribution.
 * @property {Wallet} [paymentAccount] - The payment account associated with the distribution.
 * @property {NFTDistributionCurrency} currency - The currency associated with the distribution.
 * @property {NFTDistributionNFT[]} nfts - The NFTs associated with the distribution.
 * 
 */
/**
 * @typedef {Object} NFTWalletCreationResult 
 * @property {"success"|"warn"|"error"} result - The result of the operation.
 * @property {string} message - The message associated with the result.
 * @property {Wallet} [minter] - The wallet associated with the operation.
 * @property {boolean} [authoirzedMinting] - Whether or not the wallet is authorized to mint NFTs.
 * @property {Wallet} [authoirzedMinting] - The wallet configured to mint on behalf of the minter.
 */

/**
 * @typedef {Object} NFTDistributionPaymentMethodResult
 * @property {"success"|"warn"|"error"} result - The result of the operation.
 * @property {string} message - The message associated with the result.
 * @property {"XRP" | "IC"} [paymentType] - The type of the payment method.
 * @property {string} [paymentCurrency] - The currency of the payment method.
 * @property {string} [paymentHex] - The hex of the payment method.
 * @property {string} [paymentIssuer] - The issuer of the payment method.
 * @property {string} [paymentAmount] - The amount of the payment method.
 * @property {Wallet} [paymentAccount] - The payment account associated with the payment method.
 */


/**
 * @typedef {Object} ConfigWalletCreationResult
 * @property {"success"|"warn"|"error"} result - The result of the operation.
 * @property {string} message - The message associated with the result.
 * @property {Wallet} [wallet] - The wallet object containing the wallet configuration.
 */

/**
 * @typedef {Object} NetworkConfigResult
 * @property {"success"|"warn"|"error"} result - The result of the operation.
 * @property {string} message - The message associated with the result.
 * @property {Network} [network] - The network configuration.
 * @property {NetworkRPC} [rpc] - The RPC endpoint of the network.
 */

 //else return{result:'success',accounts:accounts,networkRPC:networkRPC,network:network}

/**
 * @typedef {Object} GetAccountsAndNetworkRelatedToConfigResult
 * @property {"success"|"warn"|"error"} result - The result of the operation.
 * @property {string} message - The message associated with the result.
 * @property {Wallet[]} [accounts] - The accounts related to the configuration.
 * @property {NetworkRPC} [networkRPC] - The RPC endpoint of the network.
 * @property {Network} [network] - The network configuration.
 */



// IC RETURN TYPES

/**
 * @typedef {Object} ICBurnReadyResult
 * @property {"success"|"warn"|"error"} result - The result of the operation.
 * @property {string} message - The message associated with the result.
 * @property {string} [balance] - The balance of the IC to be burned. 
 */



//NFT RETURN TYPES

/**
 * @typedef {Object} NFTMetadataDeploymentResult
 * @property {"success"|"warn"|"error"|"failed"} result - The result of the operation.
 * @property {string} message - The message associated with the result.
 * @property {string} [uri] - The URI of the metadata.
 * 
 */