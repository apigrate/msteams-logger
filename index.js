const fetch = require('node-fetch');
const qs = require('query-string');
const debug = require('debug')('gr8:myapi');
const verbose = require('debug')('gr8:myapi:verbose');
class Connector {
  constructor(){

  }

  /**
   * Internal method to make an API call using node-fetch.
   * 
   * @param {string} method GET|POST|PUT|DELETE
   * @param {string} url api endpoint url (without query parameters)
   * @param {object} query hash of query string parameters to be added to the url
   * @param {object} payload for POST, PUT methods, the data payload to be sent
   * @param {object} options hash of additional options
   */
  async doFetch(method, url, query, payload, options){
    
    let fetchOpts = {
      method,
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Apigrate NodeJS Connector/1.0.0"
      },
    };
    
    let qstring = '';
    if(query){
      qstring = qs.stringify(query);
      qstring = '?'+qstring;
    }
    let full_url = `${url}${qstring}`;
    

    if(payload){
      fetchOpts.body = JSON.stringify(payload);
    }

    let result = null;
    try{
      debug(`${method} ${full_url}`);
      verbose(`  payload: ${JSON.stringify(payload)}`);
      
      let response = await fetch(full_url, fetchOpts);

      let result = null;
      if(response.ok){
        debug(`  ...OK HTTP-${response.status}`);
        result = await response.json();
        verbose(`  response payload: ${JSON.stringify(result)}`);
        return result;
      }

      if(!response.ok){
        this.handleNotOk(response)
      }

    }catch(err){
      //Unhandled errors are noted and re-thrown.
      console.error(err);
      throw err;
    }
  }

  /**
   * Handles API errors in a consistent manner.
   * @param {object} response the fetch response (without any of the data methods invoked) 
   * @param {string} url the full url used for the API call
   * @param {object} fetchOpts the options used by node-fetch
   */
  async handleNotOk(response, url, fetchOpts){
    debug(`  ...Error. HTTP-${response.status}`);
    
    //Note: Some APIs return HTML or text depending on status code...
    result = await response.json();
    if (response.status >=300 & response.status < 400){
      //redirection
    } else if (response.status >=400 & response.status < 500){
      //client errors
      if(response.status === 401 || response.status === 403){
        debug(result.error);
        //If OAuth, catch this error to retry after refreshing tokens. 
        throw new ApiAuthError(JSON.stringify(result));
      }
      //result = await response.json(); 
      verbose(`  response payload: ${JSON.stringify(result)}`);
    } else if (response.status >=500) {
      //server side errors
      //result = await response.json();
      verbose(`  response payload: ${JSON.stringify(result)}`);
    } else {
      throw err; //Cannot be handled.
    }
    return result;
  }

}

class ApiError extends Error {};
class ApiAuthError extends Error {};
exports.Connector = Connector;
exports.ApiError = ApiError;
exports.ApiAuthError = ApiAuthError;