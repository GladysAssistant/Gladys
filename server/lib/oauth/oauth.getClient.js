const db = require('../../models');

/**
 * @description Get client.
 * @param {string} clientId - The client ID.
 * @param {string} clientSecret - The client secret.
 * @returns {any} The requested client.
 * @example
 * oauth.getClient('my-client', 'aRandomStringAsSecret');
 */
async function getClient(clientId, clientSecret) {
  const where = {
    client_id: clientId,
  };
  if (clientSecret) {
    where.client_secret = clientSecret;
  }
  const client = await db.OAuthClient.findOne({
    where,
  });

  if (client) {
    client.redirect_uris = (client.redirect_uris || []).split('|');
    client.grants = (client.grants || []).split('|');
    return client.get({ plain: true });
  }
  return client;
}

module.exports = {
  getClient,
};
