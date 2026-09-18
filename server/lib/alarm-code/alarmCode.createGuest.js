const db = require('../../models');
const passwordUtils = require('../../utils/password');
const { BadParameters } = require('../../utils/coreErrors');
const { checkNewCode } = require('./alarmCode.checkNewCode');

/**
 * @public
 * @description Create a guest code: a code with no Gladys account behind it, for the person
 * watering the plants for a week. Only an admin can create one.
 * @param {string} createdByUserId - Id of the admin creating the code, used for the rate limit.
 * @param {object} guestCode - The code to create: name, code, and an optional valid_until.
 * @returns {Promise<object>} The created code, hash excluded.
 * @example
 * await gladys.alarmCode.createGuest(adminId, { name: 'Home help', code: '4321' });
 */
async function createGuest(createdByUserId, guestCode) {
  await this.consumeWriteRateLimit(createdByUserId);

  const { name, code, valid_until: validUntil = null } = guestCode;

  if (!name) {
    throw new BadParameters('A guest alarm code needs a name');
  }

  return this.serializeWrite(async () => {
    await checkNewCode(code);

    const createdCode = await db.AlarmCode.create({
      user_id: null,
      name,
      code: await passwordUtils.hash(code),
      valid_until: validUntil,
    });

    const plainCode = createdCode.get({ plain: true });
    delete plainCode.code;
    return plainCode;
  });
}

module.exports = {
  createGuest,
};
