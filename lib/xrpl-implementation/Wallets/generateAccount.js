const keypairs = require('ripple-keypairs');
const xrpl = require('xrpl');


let generateAccount =(seed) =>{
    let aSeed=seed?seed:keypairs.generateSeed({algorithm:'ecdsa-secp256k1'});;
    //let keypair = keypairs.deriveKeypair(aSeed);
    //let address = keypairs.deriveAddress(keypair.publicKey);
    let wallet = xrpl.Wallet.fromSeed(aSeed)
    let account =wallet
    return account
    
}

module.exports ={generateAccount};