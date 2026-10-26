const { Op } = require('sequelize');
const db = require('../../models');
const { ACCESS_TOKEN_VALIDITY } = require('../../utils/accessToken');

/**
 * @description Load in RAM cache the sessions revoked recently enough that one of their
 * access tokens could still be valid, so they stay refused after a restart.
 * @returns {Promise} Resolve when the revoked sessions are loaded.
 * @example
 * await gladys.session.init();
 */
async function init() {
  // revoking a session updates its updated_at, and an access token issued
  // before the revocation expires at most ACCESS_TOKEN_VALIDITY seconds later
  const sessions = await db.Session.findAll({
    attributes: ['id'],
    where: {
      revoked: true,
      updated_at: {
        [Op.gte]: new Date(Date.now() - ACCESS_TOKEN_VALIDITY * 1000),
      },
    },
    raw: true,
  });

  sessions.forEach((session) => {
    this.cache.set(`revoked_session:${session.id}`, true);
  });
}

module.exports = {
  init,
};
