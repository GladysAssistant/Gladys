const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @public
 * @description Revoke a code. Revoking is deleting: keeping the hash of a code nobody may use
 * again buys nothing.
 * @param {string} id - Id of the code to revoke.
 * @returns {Promise<object>} The id of the revoked code.
 * @example
 * await gladys.alarmCode.destroy('0cd30aef-9c4e-4a23-88e3-3547971296e5');
 */
async function destroy(id) {
  const code = await db.AlarmCode.findByPk(id, { attributes: ['id'] });

  if (code === null) {
    throw new NotFoundError('Alarm code not found');
  }

  await code.destroy();

  return { id };
}

module.exports = {
  destroy,
};
