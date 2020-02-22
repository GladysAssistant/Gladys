const db = require('../../models');

/**
 * @description Get all clients.
 * @returns {Promise} The OAuth clients.
 * @example
 * oauth.getAllClients();
 */
async function getAllClients() {
  const clients = await db.OAuthClient.findAll();

  return clients.map((client) => {
    const plainClient = client.get({ plain: true });
    plainClient.redirectUris = plainClient.redirect_uris.split('|').filter((d) => d.length > 0);
    plainClient.redirect_uris = plainClient.redirectUris;
    plainClient.grants = (plainClient.grants || '').split('|').filter((d) => d.length > 0);
    return plainClient;
  });
}

module.exports = {
  getAllClients,
};
