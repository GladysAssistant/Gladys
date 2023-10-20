const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get tablet model
 * @param {string} userId - Id of the user.
 * @param {string} sessionId - Uuid of the session.
 * @returns {Promise} Return session.
 * @example
 * getTabletMode('375223b3-71c6-4b61-a346-0a9d5baf12b4', '0a5f7305-4faf-42b3-aeb2-fbc0217c4855');
 */
async function getTabletMode(userId, sessionId) {
  const session = await db.Session.findOne({
    attributes: ['id', 'tablet_mode', 'current_house_id'],
    where: {
      id: sessionId,
      user_id: userId,
    },
  });

  if (session === null) {
    throw new NotFoundError('Session not found');
  }

  return session.get({ plain: true });
}

module.exports = {
  getTabletMode,
};
