const db = require('../../models');

/**
 * @public
 * @description Does this user have a code? The code itself is never readable, so this is all the
 * frontend can be told about it.
 * @param {string} userId - Id of the user.
 * @returns {Promise<boolean>} True when the user has a code.
 * @example
 * const defined = await gladys.alarmCode.existsForUser('0cd30aef-9c4e-4a23-88e3-3547971296e5');
 */
async function existsForUser(userId) {
  const codeCount = await db.AlarmCode.count({ where: { user_id: userId } });
  return codeCount > 0;
}

module.exports = {
  existsForUser,
};
