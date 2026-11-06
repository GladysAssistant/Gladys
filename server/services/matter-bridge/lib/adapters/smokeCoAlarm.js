const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { isNumber } = require('../converters');
const { ALARM_STATE, EXPRESSED_STATE } = require('../constants');
const { isFeature, zipRoles } = require('./helpers');

/**
 * @description Convert a Gladys detection to a Matter alarm state.
 * @param {number} value - 1 when smoke or CO is detected.
 * @returns {number} Matter AlarmState: Critical when detected, Normal otherwise.
 * @example
 * alarmState(1); // ALARM_STATE.CRITICAL
 */
function alarmState(value) {
  return value === 1 ? ALARM_STATE.CRITICAL : ALARM_STATE.NORMAL;
}

/**
 * @description Compute the state a smoke and CO alarm shows as a whole: smoke first, as the
 * Matter specification orders them.
 * @param {number} [smokeState] - Matter smoke AlarmState.
 * @param {number} [coState] - Matter CO AlarmState.
 * @returns {number} Matter ExpressedState.
 * @example
 * expressedState(ALARM_STATE.NORMAL, ALARM_STATE.CRITICAL); // EXPRESSED_STATE.CO_ALARM
 */
function expressedState(smokeState, coState) {
  if (smokeState === ALARM_STATE.CRITICAL) {
    return EXPRESSED_STATE.SMOKE_ALARM;
  }
  if (coState === ALARM_STATE.CRITICAL) {
    return EXPRESSED_STATE.CO_ALARM;
  }
  return EXPRESSED_STATE.NORMAL;
}

/**
 * @description Read a feature as a Matter alarm state, Normal while its value is unknown.
 * @param {object} feature - Gladys smoke or CO feature.
 * @param {Function} read - Reads the last value of a feature.
 * @returns {number} Matter AlarmState.
 * @example
 * readAlarm(roles.smoke, ctx.read);
 */
function readAlarm(feature, read) {
  const value = read(feature);
  return isNumber(value) ? alarmState(value) : ALARM_STATE.NORMAL;
}

// One Matter smoke and CO alarm per Gladys detector, carrying the smoke detection, the CO one, or
// both when the device has both.
const smokeCoAlarm = {
  key: 'smoke-co',
  // The Matter smoke and CO alarm device type requires a power source on its endpoint.
  requiresPowerSource: true,
  claim(features) {
    const binary = [DEVICE_FEATURE_TYPES.SENSOR.BINARY];
    return zipRoles({
      smoke: features.filter((f) => isFeature(f, DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR, binary)),
      co: features.filter((f) => isFeature(f, DEVICE_FEATURE_CATEGORIES.CO_SENSOR, binary)),
    });
  },
  build(matter, roles, ctx) {
    const features = [];
    const state = {
      batteryAlert: ALARM_STATE.NORMAL,
      testInProgress: false,
      hardwareFaultAlert: false,
      endOfServiceAlert: 0,
    };
    if (roles.smoke) {
      features.push('SmokeAlarm');
      state.smokeState = readAlarm(roles.smoke, ctx.read);
    }
    if (roles.co) {
      features.push('CoAlarm');
      state.coState = readAlarm(roles.co, ctx.read);
    }
    state.expressedState = expressedState(state.smokeState, state.coState);
    return {
      type: matter.devices.SmokeCoAlarmDevice.with(matter.behaviors.SmokeCoAlarmServer.with(...features)),
      state: { smokeCoAlarm: state },
    };
  },
  toMatter(role, value, roles, endpointState) {
    const current = endpointState.smokeCoAlarm;
    const attribute = role === 'smoke' ? 'smokeState' : 'coState';
    const next = { ...current, [attribute]: alarmState(value) };
    return {
      smokeCoAlarm: {
        [attribute]: next[attribute],
        expressedState: expressedState(next.smokeState, next.coState),
      },
    };
  },
  listeners: [],
};

module.exports = smokeCoAlarm;
