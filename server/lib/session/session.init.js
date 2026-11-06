const { Op } = require('sequelize');
const db = require('../../models');
const { ACCESS_TOKEN_VALIDITY } = require('../../utils/accessToken');

/**
 * @description Load in RAM cache the session states checked by validateAccessToken, so they
 * survive a restart: the sessions revoked recently enough that one of their access tokens
 * could still be valid, and the locked tablets.
 * @returns {Promise} Resolve when the sessions are loaded.
 * @example
 * await gladys.session.init();
 */
async function init() {
  // revoking a session updates its updated_at, and an access token issued
  // before the revocation expires at most ACCESS_TOKEN_VALIDITY seconds later
  const revokedSessions = await db.Session.findAll({
    attributes: ['id'],
    where: {
      revoked: true,
      updated_at: {
        [Op.gte]: new Date(Date.now() - ACCESS_TOKEN_VALIDITY * 1000),
      },
    },
    raw: true,
  });

  revokedSessions.forEach((session) => {
    this.cache.set(`revoked_session:${session.id}`, true);
  });

  // a tablet stays locked as long as the alarm is armed, whatever the age of the lock
  const lockedTabletSessions = await db.Session.findAll({
    attributes: ['id'],
    where: {
      revoked: false,
      tablet_mode_locked: true,
    },
    raw: true,
  });

  lockedTabletSessions.forEach((session) => {
    this.cache.set(`tablet_mode_locked:${session.id}`, true);
  });
}

module.exports = {
  init,
};
