/*
  MIT License

  Copyright (c) 2022 Apigrate LLC

  Permission is hereby granted, free of charge, to any person obtaining a copy
  of this software and associated documentation files (the "Software"), to deal
  in the Software without restriction, including without limitation the rights
  to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
  copies of the Software, and to permit persons to whom the Software is
  furnished to do so, subject to the following conditions:

  The above copyright notice and this permission notice shall be included in all
  copies or substantial portions of the Software.

  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
  IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
  FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
  AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
  LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
  OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
  SOFTWARE.
*/
const fetch = require('node-fetch');

/**
  A logging tool for working with MS Teams Inbound webhooks. It is intended for logging
  application automation transactions in MS Teams, providing transparency about how
  automation solutions are performing.

    By convention, these colors are used for attachment content theming: 
    success=false: color #CC0000
    success=true: color #00AA00

    By convention, these emojis are used for consistency
    question messages respectively.
    success=false: 	:x:
    success=true: :white_check_mark:

  @param {string} inbound_webhook the inbound webhook to use (you must configure this in MS Teams)
  @param {string} username the displayed username in the channel. Because the username groups together like messages on the channel, 
  a good convention is to set the username to:
  - the of the environment ("AWS test environment", "production environment")
  - or the symbolic name of the server
  @param {string} application_name name of the application_name.
  @param {*} options there are two supported options:
  @param {object} fields a hash of properties that will be added as "facts"" on every msteams entry produced by this logger. Message-specific fields can be added 
  as part of the `.log()` method.
  @example
  {
    fields: {
      "account": "abc123",
      "apigrate_account": 107
    }
  }

  @version 0.1.0
*/
const success_color = '00AA00';
const success_emoji = '\u2705';
const failure_color = 'CC0000';
const failure_emoji = '\u274c';
class MSTeamsLogger{
  constructor(inbound_webhook, username, application_name, options){
    if( !inbound_webhook || !username || !application_name ){
      throw new Error("Misconfigured MS Teams Logger. The inbound_webhook, username, and application_name parameters are all required.");
    }
    this.inbound_webhook = inbound_webhook;
    this.username = username;
    this.application_name = application_name;
    this.options = options;
    if (!options) {
      this.options = {};
    }
  }

  /**
    An async method to log a message to MS Teams.

    @param {boolean} success (required) whether the transaction succeeded or failed.
    @param {string} summary (required) a short summary message (i.e. "synced ok", "error processing account", etc.)
    @param {string} details (optional) details to be displayed in a fixed-width font block under the message. Use this to output transcript info.
    Up to 7500 characters will be written, after which the data will be truncated.
    @param {object} fields (optional) hash of properties that will be added as "facts" on this particular msteams entry. 
    These provided in addition to any existing global fields.
    @returns {boolean} indicating success or failure. Note MS Teams message failures (e.g. due to throttling) are handled and output to 
    console.error. They are **not** thrown as errors.
  */
  async log(success, summary, details, fields) {
    if( success === null || !summary ){
      console.error("Invalid MS Teams Logger log() invocation. The success and summary parameters are required.");
      return false;
    }

    var color = success_color;
    var emoji = "";
    if (success) {
      color = success_color;
      emoji = success_emoji;
    } else {
      color = failure_color;
      emoji = failure_emoji;
    }

    var title = (emoji + ' ' + summary).trim();

    var text = "";
    if (details) {
      if (details.length > 7500) {
        text = details.substr(0, 7500) + "...";
      } else {
        text = details;
      }
    }

    if (text && text.trim().length > 0) {
      text = "```" + text;
    }

    var msteams_message = {
      "@type": "MessageCard",
      "@context": "https://schema.org/extensions",
      "summary": title,
      "themeColor": color,
      "title": title,
      "sections": [
        {
          "activityTitle": this.application_name,
          "activitySubtitle": this.username,
          "facts": [],
          "activityText": text
        }
      ]
    };

    //global fields
    if(this.options && this.options.fields){
      for(let name in this.options.fields){
        let val = this.options.fields[name];
        msteams_message.sections[0].facts.push({
          name,
          value: `${val}`,
        });
      }
    }

    //specific fields
    if(fields){
      for(let name in fields){
        let val = fields[name];
        msteams_message.sections[0].facts.push({
          name,
          value: `${val}`,
        });
      }
    }

console.log(JSON.stringify(msteams_message,null,2));
    try{
      let response = await fetch(this.inbound_webhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(msteams_message)
      });
  
      if(response.ok){
        return true;
      } else {
        let result = await response.text();
        console.error(`MS Teams returned an error (HTTP-${response.status}): ${result}`);
        return false;
      }
    }catch(ex){
      console.error(`MS TeamsLogger exception.`);
      console.error(ex);
      return false;
    }

  }
}

module.exports=MSTeamsLogger;
