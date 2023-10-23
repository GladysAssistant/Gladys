const Promise = require('bluebird');
const db = require('../../models');
const { ALARM_MODES } = require('../../utils/constants');
const { NotFoundError, ForbiddenError } = require('../../utils/coreErrors');

/**
 * @public
 * @description Disarm alarm with code.
 * @param {string} selector - Selector of the house.
 * @param {string} code - Code of the house.
 * @returns {Promise} Resolve when unlocked.
 * @example
 * await gladys.house.disarmWithCode('main-house', '123456');
 */
async function disarmWithCode(selector, code) {
  const house = await db.House.findOne({
    where: {
      selector,
    },
  });

  if (house === null) {
    throw new NotFoundError('House not found');
  }

  if (house.alarm_code !== code) {
    throw new ForbiddenError('INVALID_CODE');
  }

  // In this case, we don't throw an error if the house is already disarmed
  if (house.alarm_mode === ALARM_MODES.DISARMED) {
    return house.get({ plain: true });
  }

  // Disarm house
  return this.disarm(selector);
}

module.exports = {
  disarmWithCode,
};
