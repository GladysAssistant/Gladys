const Promise = require('bluebird');
const db = require('../../models');
const { ALARM_MODES, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { NotFoundError, ConflictError } = require('../../utils/coreErrors');

/**
 * @public
 * @description Partial arm house Alarm.
 * @param {object} selector - Selector of the house.
 * @returns {Promise} Resolve with house object.
 * @example
 * const mainHouse = await gladys.house.arm('main-house');
 */
async function partialArm(selector) {
  const house = await db.House.findOne({
    where: {
      selector,
    },
  });

  if (house === null) {
    throw new NotFoundError('House not found');
  }

  if (house.alarm_mode === ALARM_MODES.PARTIALLY_ARMED) {
    throw new ConflictError('House is already partially armed');
  }

  // Update database
  await house.update({ alarm_mode: ALARM_MODES.PARTIALLY_ARMED });
  // Check scene triggers
  this.event.emit(EVENTS.TRIGGERS.CHECK, {
    type: EVENTS.ALARM.PARTIAL_ARM,
    house: selector,
  });
  // Emit websocket event to update UI
  this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ALARM.PARTIALLY_ARMED,
    payload: {
      house: selector,
    },
  });
  return house.get({ plain: true });
}

module.exports = {
  partialArm,
};
