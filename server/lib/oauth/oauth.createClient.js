const uuid = require('uuid');
const db = require('../../models');

/**
 * @description Get client.
 * @param {Object} client - The client information.
 * @returns {Promise} The client with the secret.
 * @example
 * oauth.createClient({
 *   id: 'my-client',
 *   name: 'Frindly name',
 *   redirect_uris: [ 'http://my-first-url', 'http://my-second_url' ],
 * });
 */
async function createClient(client) {
  const clientClone = Object.assign({}, client);
  clientClone.secret = uuid.v4();
  clientClone.redirect_uris = (client.redirect_uris || []).join('|');
  clientClone.grants = (client.grants || []).join('|');

  const created = await db.OAuthClient.create(clientClone);
  const plainClient = created.get({ plain: true });
  plainClient.redirectUris = (plainClient.redirect_uris || '').split('|').filter((d) => d.length > 0);
  plainClient.redirect_uris = plainClient.redirectUris;
  plainClient.grants = (plainClient.grants || '').split('|').filter((d) => d.length > 0);
  return plainClient;
}

module.exports = {
  createClient,
};
