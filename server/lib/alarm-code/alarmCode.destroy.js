const db = require('../../models');
const { NotFoundError, ForbiddenError } = require('../../utils/coreErrors');

/**
 * @public
 * @description Revoke a guest code. Revoking is deleting: keeping the hash of a code nobody may use
 * again buys nothing. A personal code is refused — it is its holder's business, and revoking it
 * would take no access away anyway, since they can set a new one at once and disarm without a code
 * while logged in.
 * @param {string} id - Id of the code to revoke.
 * @returns {Promise<object>} The id of the revoked code.
 * @example
 * await gladys.alarmCode.destroy('0cd30aef-9c4e-4a23-88e3-3547971296e5');
 */
async function destroy(id) {
  const code = await db.AlarmCode.findByPk(id, { attributes: ['id', 'user_id'] });

  if (code === null) {
    throw new NotFoundError('Alarm code not found');
  }

  if (code.user_id !== null) {
    throw new ForbiddenError('PERSONAL_ALARM_CODE');
  }

  await code.destroy();

  return { id };
}

module.exports = {
  destroy,
};
