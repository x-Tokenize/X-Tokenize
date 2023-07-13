import xrpl from 'xrpl'

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
export const getNFTokenIdFromTx = (transaction) =>{
    let {tx,meta} = transaction
    let {Account,NFTokenTaxon,TransferFee,Flags,Issuer} = tx
    let AccountToCheckSequence='';
    let TokenSequence;
    let NextTokenSequence;

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
            }
        }
      });

      if (typeof TokenSequence === "undefined" && NextTokenSequence === 1) {
        TokenSequence = 0;
      }
      else if (typeof TokenSequence === "undefined") {
        throw new Error("Unable to find Token Sequnce");
      }
        const NFTIssuer =xrpl.decodeAccountID(AccountToCheckSequence)
        const CipheredTaxon = NFTokenTaxon ^ (384160001 * TokenSequence + 2459);

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