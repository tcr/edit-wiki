// src/Auth/Auth.js

import auth0 from 'auth0-js';
import jwt_decode from 'jwt-decode';

function getHashValue(key) {
  var matches = location.hash.match(new RegExp(key + '=([^&]*)'));
  return matches ? matches[1] : null;
}

export default class Auth {
  constructor() {
    this.auth0 = new auth0.WebAuth({
      domain: process.env.AUTH0_DOMAIN,
      clientID: process.env.AUTH0_CLIENT_ID,
      redirectUri: process.env.AUTH0_REDIRECT,
      audience: `https://${process.env.AUTH0_DOMAIN}/userinfo`,
      responseType: ['token', 'id_token'].join(' '),
      scope: ['openid', 'profile', 'email'].join(' '),
    });
  }

  handleAuthentication() {
    let graphcoolToken = null;
    let idToken = null;
    try {
      idToken = getHashValue("id_token");
      let decoded = jwt_decode(idToken);
      graphcoolToken = decoded['https://graph.cool/token'];
    } catch (e) { }
    
    if (!graphcoolToken) {
      console.log('no auth');
    } else {
      this.setSession({
        idToken,
        graphcoolToken,
      });
    }
  }

  setSession(authResult) {
    // Set the time that the access token will expire at
    let expiresAt = JSON.stringify((authResult.expiresIn * 1000) + new Date().getTime());
    localStorage.setItem('id_token', authResult.idToken);
    localStorage.setItem('graphcool_token', authResult.graphcoolToken);
    // navigate to the home route
    // history.replace('/home');
  }

  login() {
    this.auth0.authorize();
  }

  logout() {
    // Clear access token and ID token from local storage
    localStorage.removeItem('id_token');
    localStorage.removeItem('graphcool_token');
    // navigate to the home route
    // history.replace('/home');
  }

  isAuthenticated() {
    // Check whether the current time is past the 
    // access token's expiry time
    // let expiresAt = JSON.parse(localStorage.getItem('expires_at'));
    // return new Date().getTime() < expiresAt;
    return !!(localStorage.getItem('graphcool_token'));
  }

  header() {
    let token = localStorage.getItem('graphcool_token');
    return token ? `Bearer ${token}` : '';
  }
}