const db = require('../../models');

/**
 * @description Invoked to retrieve a client using a client id or a client id/client secret combination.
 * @param {string} clientId - The client id of the client to retrieve.
 * @param {string} clientSecret - The client secret of the client to retrieve. Can be null.
 * @returns {Promise} An Object representing the client and associated data,
 * or a falsy value if no such client could be found.
 * @example
 * oauth.getClient('my-client', 'aRandomStringAsSecret');
 */
async function getClient(clientId, clientSecret) {
  const where = {
    id: clientId,
  };
  if (clientSecret) {
    where.secret = clientSecret;
  }
  const client = await db.OAuthClient.findOne({
    where,
  });

  if (client !== null) {
    const plainClient = client.get({ plain: true });
    plainClient.redirectUris = plainClient.redirect_uris.split('|').filter((d) => d.length > 0);
    plainClient.redirect_uris = plainClient.redirectUris;
    plainClient.grants = (plainClient.grants || '').split('|').filter((d) => d.length > 0);
    return plainClient;
  }

  return client;
}

module.exports = {
  getClient,
};
