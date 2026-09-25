const Promise = require('bluebird');

const db = require('../../models');
const passwordUtils = require('../../utils/password');
const { activeCodesWhere } = require('./activeCodes');

/**
 * @public
 * @description Find the active code matching what was typed. A bcrypt hash cannot be looked up, and
 * a keypad does not say who is standing in front of it, so the codes are compared one after
 * another: the code itself is the identity. The number of tries is bounded by the rate limit of the
 * caller.
 * @param {string} code - The code as typed.
 * @returns {Promise<object|null>} The matching code, holder included, or null.
 * @example
 * const alarmCode = await gladys.alarmCode.validate('1234');
 */
async function validate(code) {
  const codes = await db.AlarmCode.findAll({
    where: activeCodesWhere(),
    include: [
      {
        model: db.User,
        as: 'user',
        attributes: ['id', 'firstname', 'selector'],
      },
    ],
  });

  const match = await Promise.reduce(
    codes,
    async (found, row) => found || ((await passwordUtils.compare(code, row.code)) ? row : null),
    null,
  );

  if (match === null) {
    return null;
  }

  const plainCode = match.get({ plain: true });
  delete plainCode.code;
  return plainCode;
}

module.exports = {
  validate,
};
