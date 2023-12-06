const Promise = require('bluebird');

const db = require('../../models');
const { ALARM_MODES, EVENTS } = require('../../utils/constants');
const { NotFoundError, ForbiddenError, TooManyRequests } = require('../../utils/coreErrors');

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

  // We verify that the user is not requesting too much password test
  const rateLimitRes = await this.alarmCodeRateLimit.get(selector);

  // If there are no credits remaining
  if (rateLimitRes && rateLimitRes.remainingPoints === 0) {
    // Check scene triggers
    this.event.emit(EVENTS.TRIGGERS.CHECK, {
      type: EVENTS.ALARM.TOO_MANY_CODES_TESTS,
      house: selector,
    });
    throw new TooManyRequests('TOO_MANY_CODES_TESTS', rateLimitRes.msBeforeNext);
  }

  if (house.alarm_code !== code) {
    await this.alarmCodeRateLimit.consume(selector, 1);
    throw new ForbiddenError('INVALID_CODE');
  }

  // If code is right, delete all rate limit associated to this house
  await this.alarmCodeRateLimit.delete(selector);

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
