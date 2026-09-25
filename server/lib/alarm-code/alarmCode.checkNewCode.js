const Promise = require('bluebird');

const db = require('../../models');
const passwordUtils = require('../../utils/password');
const { BadParameters, ConflictError } = require('../../utils/coreErrors');
const { activeCodesWhere } = require('./activeCodes');

const CODE_REGEX = /^\d{4,8}$/;

/**
 * @description Validate the shape of a new code, and check that nobody else is already using it.
 * A code identifies its holder, so two holders cannot share one — and the check happens here
 * because this is the only moment the server holds a code in clear. The conflict never says whose
 * code it collided with.
 * @param {string} code - The code as typed by its future holder.
 * @param {string} [excludedId] - Id of a code row to ignore, so replacing a code by itself works.
 * @returns {Promise} Resolve when the code is valid and free.
 * @example
 * await checkNewCode('1234');
 */
async function checkNewCode(code, excludedId = null) {
  if (typeof code !== 'string' || !CODE_REGEX.test(code)) {
    throw new BadParameters('An alarm code is 4 to 8 digits');
  }

  const codes = await db.AlarmCode.findAll({
    attributes: ['id', 'code'],
    where: activeCodesWhere(),
  });

  const alreadyUsed = await Promise.reduce(
    codes,
    async (found, row) => {
      if (found || row.id === excludedId) {
        return found;
      }
      return passwordUtils.compare(code, row.code);
    },
    false,
  );

  if (alreadyUsed) {
    throw new ConflictError('ALARM_CODE_ALREADY_USED');
  }
}

module.exports = {
  checkNewCode,
};
