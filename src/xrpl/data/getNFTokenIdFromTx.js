import xrpl from 'xrpl'
import BigNumber from 'bignumber.js';

 /**
 * @function getNFTokenIdFromTx
 * @description
 * Extracts the Non-Fungible Token (NFT) ID from a given transaction object. The function processes the
 * transaction metadata and calculates the NFT ID based on the account sequence, flags, transfer fee, issuer, and other
 * relevant information. It then concatenates these values into a 32-byte buffer and returns the NFT ID as a hexadecimal string.
 * 
 * @param {Object} transaction - The transaction object containing the NFT information.
 * @returns {string} - The NFT ID as a hexadecimal string.
 * @throws {Error} - Throws an error if the token sequence is not found or if the token ID length is invalid.
 */

  export const getNFTokenIdFromTx = (tx) =>{
    let {Account,NFTokenTaxon,TransferFee,Flags,meta,Issuer} = tx
    //console.log(tx)

    if (typeof meta !== 'object' || !Array.isArray(meta.AffectedNodes)) {
        throw new Error('Invalid meta data.');
    }

    if (Object.prototype.hasOwnProperty.call(meta, 'nftoken_id')) {
        return meta.nftoken_id;
    }

    let AccountToCheckSequence='';
    let TokenSequence;
    let NextTokenSequence;
    let FirstNFTokenSequence;

    meta.AffectedNodes.forEach((node) => {
        if (
          node.ModifiedNode &&
          node.ModifiedNode.LedgerEntryType === "AccountRoot"
        ) {
            if(typeof Issuer ==="undefined"){AccountToCheckSequence=Account}
            else AccountToCheckSequence=Issuer
            
            const { PreviousFields, FinalFields } = node.ModifiedNode;
            if (PreviousFields && FinalFields && FinalFields.Account===AccountToCheckSequence ){
            
            TokenSequence = PreviousFields.MintedNFTokens;
            NextTokenSequence = FinalFields.MintedNFTokens;
            FirstNFTokenSequence = PreviousFields?.FirstNFTokenSequence || FinalFields?.FirstNFTokenSequence;
            }
        }
      });

      if (typeof TokenSequence === "undefined" && NextTokenSequence === 1) {
        TokenSequence = 0;
      }

      TokenSequence += FirstNFTokenSequence ?? 0

        const NFTIssuer =xrpl.decodeAccountID(AccountToCheckSequence)

        const UnscrambleTaxon = new BigNumber(384160001)
        .multipliedBy(TokenSequence)
        .modulo(4294967296)
        .plus(2459)
        .modulo(4294967296)
        .toNumber();

        // Calculate ciphered taxon
        const CipheredTaxon = (NFTokenTaxon ^ UnscrambleTaxon) >>> 0;

        const TokenID = Buffer.concat([
            Buffer.from([(Flags >> 8) & 0xff, Flags & 0xff]),
            Buffer.from([(TransferFee >> 8) & 0xff, TransferFee & 0xff]),
            NFTIssuer,
            Buffer.from([
            (CipheredTaxon >> 24) & 0xff,
            (CipheredTaxon >> 16) & 0xff,
            (CipheredTaxon >> 8) & 0xff,
            CipheredTaxon & 0xff,
            ]),
            Buffer.from([
            (TokenSequence >> 24) & 0xff,
            (TokenSequence >> 16) & 0xff,
            (TokenSequence >> 8) & 0xff,
            TokenSequence & 0xff,
            ]),
        ]);

        // should be 32 bytes
        if (TokenID.length !== 32) {
            throw new Error("Invalid token id length");
        }

        return TokenID.toString('hex').toUpperCase();
}
