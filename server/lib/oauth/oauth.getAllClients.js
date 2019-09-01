const db = require('../../models');

/**
 * @description Get all clients.
 * @returns {any[]} The OAuth clients.
 * @example
 * oauth.getAllClients();
 */
async function getAllClients() {
  const clients = await db.OAuthClient.findAll();
  clients.forEach((client) => {
    client.redirect_uris = (client.redirect_uris || []).split('|');
    if (client.grants) {
      client.grants = client.grants.split('|');
    } else {
      client.grants = [];
    }
  });
  return clients;
}

module.exports = {
  getAllClients,
};
