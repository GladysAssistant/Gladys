const { Op } = require('sequelize');
const db = require('../../models');
const { SESSION_TOKEN_TYPES } = require('../../utils/constants');

/**
 * @description Revoke the login sessions of a user, for example after a password
 * change. API keys are kept: they are created on purpose for an integration, which
 * would otherwise stop working each time the password changes.
 * @param {string} userId - Id of the user.
 * @param {string} [exceptSessionId] - Session to keep, the one the password was changed from.
 * @returns {Promise<Array>} Resolve with the ids of the revoked sessions.
 * @example
 * revokeLoginSessions('375223b3-71c6-4b61-a346-0a9d5baf12b4', '0a5f7305-4faf-42b3-aeb2-fbc0217c4855');
 */
async function revokeLoginSessions(userId, exceptSessionId = null) {
  const where = {
    user_id: userId,
    token_type: SESSION_TOKEN_TYPES.REFRESH_TOKEN,
    revoked: false,
  };
  if (exceptSessionId) {
    where.id = { [Op.ne]: exceptSessionId };
  }
  const sessions = await db.Session.findAll({
    attributes: ['id'],
    where,
  });
  const sessionIds = sessions.map((session) => session.id);

  // revoke sessions in DB
  await db.Session.update({ revoked: true }, { where: { id: sessionIds } });

  // revoke access tokens in RAM cache
  sessionIds.forEach((sessionId) => this.cache.set(`revoked_session:${sessionId}`, true));

  return sessionIds;
}

module.exports = {
  revokeLoginSessions,
};
