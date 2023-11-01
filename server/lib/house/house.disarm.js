const Promise = require('bluebird');
const db = require('../../models');
const { ALARM_MODES, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { NotFoundError, ConflictError } = require('../../utils/coreErrors');

/**
 * @public
 * @description Disarm house Alarm.
 * @param {object} selector - Selector of the house.
 * @returns {Promise} Resolve with house object.
 * @example
 * const mainHouse = await gladys.house.disarm('main-house');
 */
async function disarm(selector) {
  // In case there is a timeout to arm this house, we clear it
  clearTimeout(this.armingHouseTimeout.get(selector));
  if (this.armingHouseTimeout.get(selector)) {
    this.armingHouseTimeout.delete(selector);
  }
  // Delete all rate limit associated to this house
  await this.alarmCodeRateLimit.delete(selector);
  // Get the house from DB
  const house = await db.House.findOne({
    where: {
      selector,
    },
  });

  if (house === null) {
    throw new NotFoundError('House not found');
  }

  if (house.alarm_mode === ALARM_MODES.DISARMED) {
    throw new ConflictError('House is already disarmed');
  }
  // Update database
  await house.update({ alarm_mode: ALARM_MODES.DISARMED });
  // Unlock all tablets in this house
  await this.session.unlockTabletMode(house.id);
  // Check scene triggers
  this.event.emit(EVENTS.TRIGGERS.CHECK, {
    type: EVENTS.ALARM.DISARM,
    house: selector,
  });
  // Emit websocket event to update UI
  this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ALARM.DISARMED,
    payload: {
      house: selector,
    },
  });
  return house.get({ plain: true });
}

module.exports = {
  disarm,
};
