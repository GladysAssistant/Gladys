const db = require('../../models');

/**
 * @description Load in RAM cache the sessions whose tablet mode is locked, so their
 * access tokens stay restricted to the alarm after a restart.
 * @returns {Promise} Resolve when the locked sessions are loaded.
 * @example
 * await gladys.session.init();
 */
async function init() {
  // validateAccessToken only reads the RAM cache: without this, an access token
  // issued before a restart would be accepted with its full scope until it expires
  const lockedSessions = await db.Session.findAll({
    attributes: ['id'],
    where: {
      revoked: false,
      tablet_mode_locked: true,
    },
    raw: true,
  });

  lockedSessions.forEach((session) => {
    this.cache.set(`tablet_mode_locked:${session.id}`, true);
  });
}

module.exports = {
  init,
};
