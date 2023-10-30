const Promise = require('bluebird');
const db = require('../../models');
const { ALARM_MODES, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { NotFoundError, ConflictError } = require('../../utils/coreErrors');

/**
 * @public
 * @description Make house alarm in panic mode.
 * @param {object} selector - Selector of the house.
 * @returns {Promise} Resolve with house object.
 * @example
 * const mainHouse = await gladys.house.arm('main-house');
 */
async function panic(selector) {
  const house = await db.House.findOne({
    where: {
      selector,
    },
  });

  if (house === null) {
    throw new NotFoundError('House not found');
  }

  if (house.alarm_mode === ALARM_MODES.PANIC) {
    throw new ConflictError('House is already in panic mode');
  }
  // Update database
  await house.update({ alarm_mode: ALARM_MODES.PANIC });
  // Check scene triggers
  this.event.emit(EVENTS.TRIGGERS.CHECK, {
    type: EVENTS.ALARM.PANIC,
    house: selector,
  });
  // Emit websocket event to update UI
  this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ALARM.PANIC,
    payload: {
      house: selector,
    },
  });
  return house.get({ plain: true });
}

module.exports = {
  panic,
};
