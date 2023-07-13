import axios from "axios"
import { pressAnyKey } from "../../utils/index.js"

/**
 * @function submitRequest
 * @description
 * Submits an HTTP POST request to the specified networkRPC with the given request object. The function
 * first sends the request using axios.post and then checks the response status. If the status is 200 and the response
 * contains data, it returns the result. If the status is 404, it logs an error message and returns a failed result
 * object with a message. For other status codes, it logs the error and returns a failed result object with the status
 * code in the message. If there is an error while submitting the request, it logs the error and the request object, and
 * returns a failed result object with a message.
 * 
 * @param {Object} request - The request object to be sent in the HTTP POST request.
 * @param {string} networkRPC - The URL of the server to send the request to.
 * @returns {Promise<Object>} - An object containing the result of the request and an optional message.
 * @throws {Error} - If there is a problem submitting the request.
 */
export const submitRequest = async(request,networkRPC)=>{
        try
        {
            let response = await axios.post(networkRPC,request)
            if(response.status===200 && response.data && response.data.result) return response.data.result
            else if(response.status === 404)
            {
                console.log('The server responded with a 404 error. Please check the server address and try again.')
                await pressAnyKey()
                return {result:'failed',message:'The server responded with a 404 error. Please check your request and try again.'}
            }
            else
            {
                console.log(`The server responded with a ${response.status} error.`)
                await pressAnyKey()
                return {result:'failed',message:`The server responded with a ${response.status} error.`}
            }
        }
        catch(err)
        {
            console.log('There was a problem submitting the request: ',err)
            console.log('The request was: ',request)
            await pressAnyKey()
            return {result:'failed',message:`There was a problem submitting the request.`}
        }
}

/**
 * @function longRequest
 * @description
 * Submits a series of requests to the specified networkRPC with the given request object, handling
 * pagination using markers. The function initializes an empty data array and a marker variable. It then enters a loop
 * that continues until the marker is empty. Inside the loop, it updates the request object with the current marker (if
 * not empty) and calls submitRequest to send the request. It then appends the response data to the data array and
 * updates the marker with the response marker (if present). Once the loop is finished, it returns the combined data
 * array. If there is an error during the process, it logs the error and rejects the promise.
 * 
 * @param {string} dataPointName - The name of the data property in the response object.
 * @param {Object} request - The request object to be sent in the HTTP POST request.
 * @param {string} networkRPC - The URL of the server to send the request to.
 * @returns {Promise<Array>} - An array containing the combined data from all requests.
 * @throws {Error} - If there is a problem with the long request.
 */
export const longRequest = async (dataPointName,request, networkRPC) => {
        try{
            let data = [];
            let marker = "";
            do
            {
                let response
                if(marker!=="")
                {
                    request.params[0].marker=marker;
                }
                response = await submitRequest(request, networkRPC)
                data.push.apply(data,response[dataPointName]);
                if(response.marker) marker=response.marker;
                else marker="";
            }
            while(marker!="")
            return data
        }
        catch(err)
        {
            console.log('There was a problem with the long request: ',err)
            reject(err)
        }
}