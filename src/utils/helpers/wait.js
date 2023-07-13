 /**
 * @function wait
 * @description
 * A utility function that creates a Promise that resolves after a specified number of milliseconds. This
 * can be used to introduce a delay in the execution of asynchronous code.
 * 
 * @param {number} ms - The number of milliseconds to wait before resolving the Promise.
 * @returns {Promise} - A Promise that resolves after the specified number of milliseconds.
 */
export const wait = (ms) => {
    return new Promise(resolve => setTimeout(resolve, ms));
}