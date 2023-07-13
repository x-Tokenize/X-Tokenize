
import axios from 'axios';
import express from 'express';
import CryptoJS from "crypto-js";
import querystring from 'querystring';
import open from 'open'
import { pressAnyKey, wait } from '../../utils/index.js'
import { configHandler } from '../../config/configHandler.js';


function base64URLEncode(str) {
    const base64 = CryptoJS.enc.Base64.stringify(str);
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }

function generateRandomString(length) {
const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
let randomString = '';
for (let i = 0; i < length; i++) {
    randomString += charset.charAt(Math.floor(Math.random() * charset.length));
}
return randomString;
}

export const refreshAccessTokenServer = async(APIKey)=>{
    try
    {
        const app = express()
        let accessToken = null;
        const port = 1589;
        const codeVerifier = generateRandomString(32);
        const codeChallenge = base64URLEncode(CryptoJS.SHA256(codeVerifier));
        
        const authorizationEndpoint = 'https://oauth2.xumm.app/authorize';
        const params = new URLSearchParams({
          response_type: 'code',
          client_id: APIKey,
          redirect_uri: `http://localhost:${port}/callback`,
          code_challenge: codeChallenge,
          code_challenge_method: 'S256',
        });
        
        const authorizationURL = `${authorizationEndpoint}?${params}`;
        open(authorizationURL);
        
        app.get('/callback', async (req, res) => {
            const authorizationCode = req.query.code;
            const tokenEndpoint = 'https://oauth2.xumm.app/token';
            const headers = { 'Content-Type': 'application/x-www-form-urlencoded' };
            const data = {
              grant_type: 'authorization_code',
              code: authorizationCode,
              redirect_uri: `http://localhost:${port}/callback`,
              client_id: APIKey,
              code_verifier: codeVerifier
            };
            try 
            {
                const response = await axios.post(tokenEndpoint, querystring.stringify(data), { headers });
                accessToken = response.data.access_token;
                res.send('Access Token Received. You can close this window now.')
                let currentConfig = configHandler.getConfigs()
                let settings = currentConfig.XTOKENIZE_SETTINGS
                // let settings = configHandler.getConfigs(`XTOKENIZE_SETTINGS`)
                let dateNow = new Date()
                console.log(response.data)
                settings.xumm.expires = dateNow.getTime() + (response.data.expires_in * 1000)
                settings.xumm.token = accessToken
                configHandler.XTOKENIZE_SETTINGS.set(settings)
                currentConfig.XTOKENIZE_SETTINGS = settings
                await configHandler.updateCurrentConfig(currentConfig)
            }
            catch(err)
            {
                console.log('There was a problem getting the access token.')
            }
        });

        let server = app.listen(port, () => {
            console.log(`Waiting for sign in callback on ${port}`);
          });
          return server
    }
    catch(err)
    {
        console.log('There was a problem handling the XUMM Sign In Server.')
    }
}
