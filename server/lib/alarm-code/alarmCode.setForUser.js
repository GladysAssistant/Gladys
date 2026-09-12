const db = require('../../models');
const passwordUtils = require('../../utils/password');
const { NotFoundError } = require('../../utils/coreErrors');
const { checkNewCode } = require('./alarmCode.checkNewCode');

/**
 * @public
 * @description Set or replace the personal code of one user. Nobody else can set it: an admin
 * hands out guest codes instead.
 * @param {string} userId - Id of the user this code belongs to.
 * @param {string} code - The new code, 4 to 8 digits.
 * @returns {Promise<object>} The id of the created or updated code.
 * @example
 * await gladys.alarmCode.setForUser('0cd30aef-9c4e-4a23-88e3-3547971296e5', '1234');
 */
async function setForUser(userId, code) {
  await this.consumeWriteRateLimit(userId);

  const user = await db.User.findByPk(userId, { attributes: ['id'] });
  if (user === null) {
    throw new NotFoundError('User not found');
  }

  const existingCode = await db.AlarmCode.findOne({ where: { user_id: userId } });

  // Replacing a code by itself is not a conflict with itself.
  await checkNewCode(code, existingCode === null ? null : existingCode.id);

  const hashedCode = await passwordUtils.hash(code);

  if (existingCode !== null) {
    await existingCode.update({ code: hashedCode });
    return { id: existingCode.id };
  }

  const createdCode = await db.AlarmCode.create({ user_id: userId, code: hashedCode });
  return { id: createdCode.id };
}

module.exports = {
  setForUser,
};
