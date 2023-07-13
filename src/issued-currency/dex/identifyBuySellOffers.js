

 /**
 * @function identifyBuySellOffers
 * @description
 * This function takes in an array of account offers and categorizes them into buy and sell offers. It
 * then sorts the buy offers in ascending order of quality and the sell offers in descending order of quality.
 * 
 * @param {Array} accountOffers - An array of account offers containing information about the offer type and quality.
 * @returns {Object} - An object containing two properties: buyOffers and sellOffers, both of which are arrays
 * containing the sorted offers.
 */
export const identifyBuySellOffers = (accountOffers)=>{
    let sellOffers =[]
    let buyOffers =[]
    accountOffers.map((item)=>{
        if(typeof(item.taker_gets)=="string")buyOffers.push(item)
        else sellOffers.push(item)
    })
    buyOffers.sort((a,b)=>a.quality-b.quality)
    sellOffers.sort((a,b)=>b.quality-a.quality)
  


    return ({buyOffers,sellOffers})
}