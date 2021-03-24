const Promise = require('bluebird');
const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Invoked to update a client using client data.
 * @param {string} clientId - The client id of the client to update.
 * @param {boolean} active - The new status.
 * @returns {Promise} The updated status.
 * @example
 * oauth.updateClientStatus('my-client', true);
 */
async function updateClientStatus(clientId, active) {
  const where = {
    id: clientId,
  };
  const client = await db.OAuthClient.findOne({
    where,
  });

  if (!client) {
    throw new NotFoundError(`OAuth client with id ${clientId} not found.`);
  }

  await client.update({ active });

  if (!active) {
    // Revoke all sessions
    const sessions = await db.Session.findAll({
      where: {
        client_id: clientId,
        revoked: false,
      },
    });

    await Promise.map(sessions, async (sessionRaw) => {
      // revoke session in DB
      await sessionRaw.update({ revoked: true });

      // revoke access token in RAM cache
      const session = sessionRaw.get({ plain: true });
      this.session.cache.set(`revoked_session:${session.id}`, true);
    });
  }

  return active;
}

module.exports = {
  updateClientStatus,
};
