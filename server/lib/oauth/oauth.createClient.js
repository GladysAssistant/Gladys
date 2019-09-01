const uuid = require('uuid');
const db = require('../../models');

/**
 * @description Get client.
 * @param {Object} client - The client information.
 * @returns {Object} The client with the secret.
 * @example
 * oauth.createClient({
 *   client_id: 'my-client',
 *   redirect_uris: [ 'http://my-first-url', 'http://my-second_url' ],
 * });
 */
async function createClient(client) {
  const clientClone = Object.assign({}, client);
  clientClone.client_secret = uuid.v4();
  clientClone.redirect_uris = (client.redirect_uris || []).join('|');
  clientClone.grants = (client.grants || []).join('|');

  const created = await db.OAuthClient.create(clientClone);
  if (created) {
    created.redirect_uris = created.redirect_uris.split('|');
    created.grants = created.grants.split('|');
    return created.get({ plain: true });
  }
  return created;
}

module.exports = {
  createClient,
};
