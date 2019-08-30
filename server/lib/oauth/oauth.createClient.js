const WebCrypto = require('node-webcrypto-ossl');
const db = require('../../models');

const crypto = new WebCrypto();

/**
 * @description Get client.
 * @param {Object} client - The client information.
 * @returns {Object} The client with the secret.
 * @example
 * oauth.createClient({
 *   client_id: 'my-client',
 *   redirect_uri: [ 'http://my-first-url', 'http://my-second_url' ],
 * });
 */
async function createClient(client) {
  client.client_secret = await crypto.generateKey({
    name: 'RSASSA-PKCS1-v1_5',
    modulusLength: 256,
    publicExponent: new Uint8Array([1, 0, 1]),
    hash: {
      name: 'SHA-256',
    },
  });
  return db.OAuthClient.create(client);
}

module.exports = {
  createClient,
};
