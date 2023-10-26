const Promise = require('bluebird');
const db = require('../../models');
const { ALARM_MODES, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { NotFoundError, ConflictError } = require('../../utils/coreErrors');

/**
 * @public
 * @description Arm house Alarm.
 * @param {string} selector - Selector of the house.
 * @param {boolean} disableWaitTime - Should not wait to arm.
 * @returns {Promise} Resolve with house object.
 * @example
 * const mainHouse = await gladys.house.arm('main-house');
 */
async function arm(selector, disableWaitTime = false) {
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
  // Check trigger scene is arming
  this.event.emit(EVENTS.TRIGGERS.CHECK, {
    type: EVENTS.ALARM.ARMING,
    house: selector,
  });

  const waitTimeInMs = disableWaitTime ? 0 : house.alarm_delay_before_arming * 1000;

  const armHouse = async () => {
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
  };

  // if the wait time is 0, just arm now
  if (waitTimeInMs === 0) {
    await armHouse();
  } else {
    // Wait the delay before arming
    const currentTimeout = setTimeout(armHouse, waitTimeInMs);

    // store the timeout so we can cancel it if needed
    this.armingHouseTimeout.set(selector, currentTimeout);
  }
}

module.exports = {
  arm,
};
