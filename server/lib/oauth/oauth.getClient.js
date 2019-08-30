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
    return {
      clientId: client.client_id,
      clientSecret: client.client_secret,
      grants: ['password'],
    };
  }
  return client;
}

module.exports = {
  getClient,
};
