import { askForTextInput, pressAnyKey } from "../helpers/ask.js"
import { infoMessage, warningMessage } from "../output/message.js"

/**
 * @function filterList
 * @description
 * This function takes a list and a message as input parameters, and filters the list based on user input.
 * If the list has more than 20 items, it prompts the user to enter a string to filter the list by items that start with
 * the entered string. The function returns an object containing the result, a message, and the filtered list. If the
 * filtered list still has more than 20 items, it recursively calls itself until the list has less than 20 items or the
 * user cancels the operation.
 * 
 * @param {Array} list - The list to be filtered.
 * @param {string} message - The message to be displayed to the user when prompting for input.
 * @returns {Object} - An object containing the result ('success' or 'warn'), a message, and the filtered list
 * (if successful).
 * @throws {Error} - If there is a problem filtering the list, an error message is logged to the console.
 */
export const filterList= async(list,message)=>{
        try
        {
            if(list.length>20)
            {
                let beginsWith = await askForTextInput(message)
                if(beginsWith==='0')return {result:'warn',message:'User cancelled the operation.'}
                else
                {
                    let filtered = list.filter(item=>{
                        let lower = item.toLowerCase()
                        return lower.startsWith(beginsWith.toLowerCase())
                    })
                    if(filtered.length===0)
                    {
                        warningMessage(`No items in the list begin with ${beginsWith}.`)
                        return await filterList(list,message)
                    }
                    else if(filtered.length>20)
                    {
                        warningMessage(`There are ${filtered.length} items in the list that begin with ${beginsWith}.`)
                        infoMessage(`Please enter more characters to narrow the list to less than 20 items.`)
                        await pressAnyKey()
                        return await filterList(list,message)
                    }
                    else
                    {
                        return {result:'success',message:`The list was filtered successfully.`,filtered:filtered}
                    }
                }
            }
            else return {result:'success',message:`The list was filtered successfully.`,filtered:list}
            
        }
        catch(err)
        {
            console.log('There was a problem filtering the list: ',err)
        }

}