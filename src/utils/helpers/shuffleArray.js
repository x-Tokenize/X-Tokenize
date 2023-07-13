 /**
 * @function shuffleArray
 * @description
 * Shuffles the elements of an input array a specified number of times using the Fisher-Yates algorithm.
 * The function iterates through the array, swapping the current element with a randomly chosen element that comes
 * before it. This process is repeated for the specified number of times, effectively randomizing the order of the
 * elements in the array.
 * 
 * @param {Array} array - The input array to be shuffled.
 * @param {number} numberOfTimes - The number of times the shuffling process should be performed.
 * @returns {Array} - The shuffled array.
 */
export const shuffleArray = (array,numberOfTimes)=>{
    while(numberOfTimes)
    {
        let m = array.length, t, i;
        while (m) {
        i = Math.floor(Math.random() * m--);
        t = array[m];
        array[m] = array[i];
        array[i] = t;
        }
        numberOfTimes--;
    }
    return array;
}