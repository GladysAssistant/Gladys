const Promise = require('bluebird');
const db = require('../../models');
const { ALARM_MODES, EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { NotFoundError, ConflictError, BadParameters } = require('../../utils/coreErrors');
const { NOBODY } = require('../../utils/alarmEventAuthor');
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
 * @param {object} [author] - Who asked, as `{ user, user_name }`; nobody by default.
 * @returns {Promise} Resolve when the house is armed, or when the delay before arming started.
 * @example
 * await gladys.house.arm('main-house', ALARM_MODES.NIGHT_ARMED);
 */
async function arm(selector, mode, disableWaitTime = false, author = NOBODY) {
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
      ...author,
    },
  });
  // Check trigger scene is arming
  this.event.emit(EVENTS.TRIGGERS.CHECK, {
    type: EVENTS.ALARM.ARMING,
    house: selector,
    ...author,
  });

  const waitTimeInMs = disableWaitTime ? 0 : house.alarm_delay_before_arming * 1000;

  const armHouse = async () => {
    // The delay is over: this house is no longer arming, and `disarm` must not treat it as such.
    this.armingHouseTimeout.delete(selector);
    // Update database
    await house.update({ alarm_mode: mode });

    // Locking the tablets of the house only makes sense when a code exists to unlock them,
    // otherwise the tablet is stuck on a keypad nobody can answer.
    if (await this.alarmCode.existsActive()) {
      logger.info('An alarm code exists, locking tablets');
      // Lock all tablets in this house
      await this.session.setTabletModeLocked(house.id);
    } else {
      logger.info('No alarm code exists, skipping setTabletModeLocked');
    }

    // Check scene triggers
    this.event.emit(EVENTS.TRIGGERS.CHECK, {
      type: modeEvents.trigger,
      house: selector,
      ...author,
    });
    // Emit websocket event to update UI
    this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: modeEvents.websocket,
      payload: {
        house: selector,
        ...author,
      },
    });
  };

  // An arming already running is replaced, never stacked: asking for Night while Presence is
  // counting down must leave one timer, not two racing to write their own mode.
  if (this.armingHouseTimeout.has(selector)) {
    clearTimeout(this.armingHouseTimeout.get(selector));
    this.armingHouseTimeout.delete(selector);
  }

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
