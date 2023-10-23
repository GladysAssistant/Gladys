const Promise = require('bluebird');
const db = require('../../models');
const { ALARM_MODES, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { NotFoundError, ConflictError } = require('../../utils/coreErrors');

/**
 * @public
 * @description Arm house Alarm.
 * @param {object} selector - Selector of the house.
 * @returns {Promise} Resolve with house object.
 * @example
 * const mainHouse = await gladys.house.arm('main-house');
 */
async function arm(selector) {
  const house = await db.House.findOne({
    where: {
      selector,
    },
  });

  if (house === null) {
    throw new NotFoundError('House not found');
  }

  if (house.alarm_mode === ALARM_MODES.ARMED) {
    throw new ConflictError('House is already armed');
  }

  // Emit websocket event to tell UI an alarm is arming
  this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ALARM.ARMING,
    payload: {
      house: selector,
    },
  });
  // Wait the delay before arming
  setTimeout(async () => {
    // Update database
    await house.update({ alarm_mode: ALARM_MODES.ARMED });
    // Lock all tablets in this house
    await this.session.setTabletModeLocked(house.id);
    // Check scene triggers
    this.event.emit(EVENTS.TRIGGERS.CHECK, {
      type: EVENTS.ALARM.ARM,
      house: selector,
    });
    // Emit websocket event to update UI
    this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.ALARM.ARMED,
      payload: {
        house: selector,
      },
    });
  }, house.alarm_delay_before_arming * 1000);
}

module.exports = {
  arm,
};
