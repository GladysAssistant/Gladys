const crypto = require('crypto');
const querystring = require('querystring');
const { URL } = require('url');
const axios = require('axios');

const { MELCLOUD_HOME_AUTH_ENDPOINT, OAUTH } = require('../utils/melcloud-home.constants');

/**
 * @description Base64-url encode a buffer (RFC 7636).
 * @param {Buffer} buffer - Bytes to encode.
 * @returns {string} Base64-url encoded string.
 * @example
 * base64UrlEncode(Buffer.from('hello'));
 */
function base64UrlEncode(buffer) {
  return buffer
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=/g, '');
}

/**
 * @description Generate a PKCE code verifier and its S256 challenge.
 * @returns {object} An object with codeVerifier and codeChallenge.
 * @example
 * const { codeVerifier, codeChallenge } = generatePkce();
 */
function generatePkce() {
  const codeVerifier = base64UrlEncode(crypto.randomBytes(32));
  const codeChallenge = base64UrlEncode(
    crypto
      .createHash('sha256')
      .update(codeVerifier)
      .digest(),
  );
  return { codeVerifier, codeChallenge };
}

/**
 * @description Decode the few HTML entities found in form attributes.
 * @param {string} value - Raw attribute value.
 * @returns {string} Decoded value.
 * @example
 * decodeHtmlEntities('a&amp;b');
 */
function decodeHtmlEntities(value) {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&#x2F;/g, '/')
    .replace(/&#x3D;/g, '=')
    .replace(/&quot;/g, '"');
}

/**
 * @description Host-scoped cookie jar. Cookies are stored per host so that cookies
 * set by the identity provider are not leaked to the authorization server (and vice versa).
 * @returns {object} A cookie jar with update/serialize helpers.
 * @example
 * const jar = createCookieJar();
 */
function createCookieJar() {
  const store = {};
  return {
    update(url, setCookieHeaders) {
      if (!setCookieHeaders) {
        return;
      }
      const { host } = new URL(url);
      store[host] = store[host] || {};
      setCookieHeaders.forEach((cookie) => {
        const [pair] = cookie.split(';');
        const index = pair.indexOf('=');
        if (index > 0) {
          store[host][pair.slice(0, index).trim()] = pair.slice(index + 1).trim();
        }
      });
    },
    serialize(url) {
      const { host } = new URL(url);
      const cookies = store[host] || {};
      return Object.keys(cookies)
        .map((name) => `${name}=${cookies[name]}`)
        .join('; ');
    },
  };
}

/**
 * @description Extract the login form action URL and inputs from an HTML page.
 * @param {string} html - The login page HTML.
 * @returns {object} An object with the form `action` and a map of `fields`.
 * @example
 * parseLoginForm(html);
 */
function parseLoginForm(html) {
  const actionMatch = html.match(/<form[^>]*\baction=["']([^"']+)["']/i);
  const action = actionMatch ? decodeHtmlEntities(actionMatch[1]) : null;

  const fields = {};
  const inputRegex = /<input[^>]*>/gi;
  let match = inputRegex.exec(html);
  while (match !== null) {
    const input = match[0];
    const nameMatch = input.match(/\bname=["']([^"']+)["']/i);
    const valueMatch = input.match(/\bvalue=["']([^"']*)["']/i);
    if (nameMatch) {
      fields[nameMatch[1]] = valueMatch ? decodeHtmlEntities(valueMatch[1]) : '';
    }
    match = inputRegex.exec(html);
  }

  return { action, fields };
}

/**
 * @description Follow the redirect chain from a start URL until either the
 * `melcloudhome://` authorization-code redirect is captured, or a terminal HTML
 * page (such as the login form) is reached. Handles the Duende IdentityServer
 * `/Redirect?RedirectUri=...` interstitial page which navigates via JavaScript.
 * @param {object} client - Axios instance configured with maxRedirects 0.
 * @param {object} jar - Cookie jar.
 * @param {string} startUrl - URL to start following from.
 * @returns {Promise<object>} An object with the authorization `code`, or the terminal `html` and `finalUrl`.
 * @example
 * await followChain(client, jar, url);
 */
async function followChain(client, jar, startUrl) {
  let url = startUrl;
  for (let i = 0; i < 15; i += 1) {
    if (url.startsWith(OAUTH.REDIRECT_URI)) {
      const { searchParams } = new URL(url);
      return { code: searchParams.get('code') };
    }
    // eslint-disable-next-line no-await-in-loop
    const response = await client.get(url, { headers: { Cookie: jar.serialize(url) } });
    jar.update(url, response.headers['set-cookie']);

    if (response.status >= 300 && response.status < 400 && response.headers.location) {
      url = new URL(response.headers.location, url).toString();
    } else {
      const redirectUri = new URL(url).searchParams.get('RedirectUri');
      if (redirectUri) {
        url = new URL(redirectUri, url).toString();
      } else {
        return { html: String(response.data), finalUrl: url };
      }
    }
  }
  return {};
}

/**
 * @description Exchange an authorization code for an access/refresh token pair.
 * @param {string} code - The authorization code.
 * @param {string} codeVerifier - The PKCE code verifier.
 * @returns {Promise<object>} Token response ({ access_token, refresh_token, expires_in }).
 * @example
 * await exchangeCode(code, codeVerifier);
 */
async function exchangeCode(code, codeVerifier) {
  const { data } = await axios.post(
    `${MELCLOUD_HOME_AUTH_ENDPOINT}/connect/token`,
    querystring.stringify({
      grant_type: 'authorization_code',
      client_id: OAUTH.CLIENT_ID,
      code,
      redirect_uri: OAUTH.REDIRECT_URI,
      code_verifier: codeVerifier,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: OAUTH.BASIC_AUTH,
      },
    },
  );
  return data;
}

/**
 * @description Perform the OAuth 2.0 Authorization Code + PKCE flow to obtain tokens.
 * This is a headless implementation of the login flow used by the MELCloud Home
 * mobile application. It performs a Pushed Authorization Request (PAR), follows the
 * authorization redirect to the identity provider (an AWS Cognito hosted login page),
 * submits the user credentials, follows the redirect chain back through the
 * authorization server and captures the authorization code from the `melcloudhome://`
 * redirect, then exchanges it for tokens.
 * @param {string} email - MELCloud Home account email.
 * @param {string} password - MELCloud Home account password.
 * @returns {Promise<object>} Token response ({ access_token, refresh_token, expires_in }).
 * @example
 * await login('john@doe.com', 'password');
 */
async function login(email, password) {
  const client = axios.create({
    maxRedirects: 0,
    // We follow redirects manually to keep track of per-host cookies and to capture
    // the `melcloudhome://` redirect (a custom scheme that axios cannot follow).
    validateStatus: (status) => status >= 200 && status < 400,
  });

  const jar = createCookieJar();
  const { codeVerifier, codeChallenge } = generatePkce();
  const state = base64UrlEncode(crypto.randomBytes(16));

  // Step 1 — Pushed Authorization Request (PAR).
  const parUrl = `${MELCLOUD_HOME_AUTH_ENDPOINT}/connect/par`;
  const parResponse = await client.post(
    parUrl,
    querystring.stringify({
      client_id: OAUTH.CLIENT_ID,
      redirect_uri: OAUTH.REDIRECT_URI,
      response_type: OAUTH.RESPONSE_TYPE,
      scope: OAUTH.SCOPE,
      state,
      code_challenge: codeChallenge,
      code_challenge_method: OAUTH.CODE_CHALLENGE_METHOD,
    }),
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  );
  jar.update(parUrl, parResponse.headers['set-cookie']);
  const requestUri = parResponse.data.request_uri;

  // Step 2 — Authorize, then follow redirects to the login form.
  const authorizeUrl = `${MELCLOUD_HOME_AUTH_ENDPOINT}/connect/authorize?${querystring.stringify({
    client_id: OAUTH.CLIENT_ID,
    request_uri: requestUri,
  })}`;
  const loginPage = await followChain(client, jar, authorizeUrl);
  if (!loginPage.html) {
    throw new Error('MELCloud Home: unable to reach the login form.');
  }

  // Step 3 — Submit credentials to the login form.
  const { action, fields } = parseLoginForm(loginPage.html);
  if (!action) {
    throw new Error('MELCloud Home: unable to parse the login form.');
  }
  const loginActionUrl = new URL(action, loginPage.finalUrl).toString();
  const loginResponse = await client.post(
    loginActionUrl,
    querystring.stringify({
      ...fields,
      username: email,
      password,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Cookie: jar.serialize(loginActionUrl),
      },
    },
  );
  jar.update(loginActionUrl, loginResponse.headers['set-cookie']);

  if (!loginResponse.headers.location) {
    // A 200 response means the login form was returned again (bad credentials).
    throw new Error('MELCloud Home: login failed (check your credentials).');
  }

  // Step 4 — Follow the redirect chain until the `melcloudhome://` authorization code.
  const afterLoginUrl = new URL(loginResponse.headers.location, loginActionUrl).toString();
  const { code } = await followChain(client, jar, afterLoginUrl);
  if (!code) {
    throw new Error('MELCloud Home: login failed, no authorization code returned (check your credentials).');
  }

  // Step 5 — Exchange the authorization code for tokens.
  return exchangeCode(code, codeVerifier);
}

/**
 * @description Refresh an access token using a refresh token.
 * @param {string} refreshToken - The refresh token.
 * @returns {Promise<object>} Token response ({ access_token, refresh_token, expires_in }).
 * @example
 * await refresh(refreshToken);
 */
async function refresh(refreshToken) {
  const { data } = await axios.post(
    `${MELCLOUD_HOME_AUTH_ENDPOINT}/connect/token`,
    querystring.stringify({
      grant_type: 'refresh_token',
      client_id: OAUTH.CLIENT_ID,
      refresh_token: refreshToken,
    }),
    {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        Authorization: OAUTH.BASIC_AUTH,
      },
    },
  );
  return data;
}

module.exports = {
  generatePkce,
  parseLoginForm,
  createCookieJar,
  followChain,
  login,
  exchangeCode,
  refresh,
};
