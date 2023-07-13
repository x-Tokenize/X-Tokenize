import QRCode from 'qrcode'

 /**
 * @function printQR
 * @description
 * Generates a QR code in terminal format for the given content and prints it to the console. If there is
 * an error during the generation process, an error message will be printed to the console instead.
 * 
 * @param {string} content - The content to be encoded into the QR code.
 * @returns {void} - No return value.
 * @throws {Error} - Throws an error if there is a problem generating the QR code.
 */

export const printQR = async (content) => {
    try
    {
        let qr = await QRCode.toString(content,{type:'terminal'})
        return console.log(`\n${qr}\n`)
    }
    catch(err)
    {
        console.log(`There was a problem printing the QR code: ${err}`)
    }
}
