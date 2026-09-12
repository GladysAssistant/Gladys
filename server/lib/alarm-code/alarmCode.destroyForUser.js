const db = require('../../models');

/**
 * @public
 * @description Delete the personal code of one user. Deleting a code that is not there is not an
 * error: the user asked for "no code", and that is the result either way.
 * @param {string} userId - Id of the user.
 * @returns {Promise} Resolve when the user has no code left.
 * @example
 * await gladys.alarmCode.destroyForUser('0cd30aef-9c4e-4a23-88e3-3547971296e5');
 */
async function destroyForUser(userId) {
  await db.AlarmCode.destroy({ where: { user_id: userId } });
}

module.exports = {
  destroyForUser,
};
