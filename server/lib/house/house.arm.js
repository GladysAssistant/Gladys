const Promise = require('bluebird');
const db = require('../../models');
const { ALARM_MODES, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { NotFoundError, ConflictError, BadParameters } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

// The three arming modes behave identically — same delay, same tablet locking — so they only
// differ by the events they announce themselves with.
const ARM_MODE_EVENTS = {
  [ALARM_MODES.PRESENCE_ARMED]: {
    trigger: EVENTS.ALARM.PRESENCE_ARM,
    websocket: WEBSOCKET_MESSAGE_TYPES.ALARM.PRESENCE_ARMED,
  },
  [ALARM_MODES.NIGHT_ARMED]: {
    trigger: EVENTS.ALARM.NIGHT_ARM,
    websocket: WEBSOCKET_MESSAGE_TYPES.ALARM.NIGHT_ARMED,
  },
  [ALARM_MODES.AWAY_ARMED]: {
    trigger: EVENTS.ALARM.AWAY_ARM,
    websocket: WEBSOCKET_MESSAGE_TYPES.ALARM.AWAY_ARMED,
  },
};

/**
 * @public
 * @description Arm house alarm in one of the three arming modes.
 * @param {string} selector - Selector of the house.
 * @param {string} mode - Arming mode to switch to.
 * @param {boolean} disableWaitTime - Should not wait to arm.
 * @returns {Promise} Resolve when the house is armed, or when the delay before arming started.
 * @example
 * await gladys.house.arm('main-house', ALARM_MODES.NIGHT_ARMED);
 */
async function arm(selector, mode, disableWaitTime = false) {
  const modeEvents = ARM_MODE_EVENTS[mode];

  if (!modeEvents) {
    throw new BadParameters(`"${mode}" is not an alarm arming mode`);
  }

  const house = await db.House.findOne({
    where: {
      selector,
    },
  });

  if (house === null) {
    throw new NotFoundError('House not found');
  }

  if (house.alarm_mode === mode) {
    throw new ConflictError(`House is already armed in mode ${mode}`);
  }

  // Emit websocket event to tell UI an alarm is arming
  this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.ALARM.ARMING,
    payload: {
      house: selector,
      mode,
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
    await house.update({ alarm_mode: mode });

    const alarmCodeIsDefined = !(
      house.alarm_code === null ||
      house.alarm_code === '' ||
      house.alarm_code === undefined
    );

    if (alarmCodeIsDefined) {
      logger.info('House alarm code is set, locking tablets');
      // Lock all tablets in this house
      await this.session.setTabletModeLocked(house.id);
    } else {
      logger.info('House alarm code is not set, skipping setTabletModeLocked');
    }

    // Check scene triggers
    this.event.emit(EVENTS.TRIGGERS.CHECK, {
      type: modeEvents.trigger,
      house: selector,
    });
    // Emit websocket event to update UI
    this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: modeEvents.websocket,
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
