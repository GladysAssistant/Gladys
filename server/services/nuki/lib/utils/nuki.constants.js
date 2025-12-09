const { LOCK } = require('../../../../utils/constants');

const CONFIGURATION = {
  NUKI_API_KEY: 'NUKI_API_KEY',
};

const DEVICE_PARAM_NAME = {
  PROTOCOL: 'protocol',
  USERNAME: 'username',
  PASSWORD: 'password',
};

const DEVICE_PARAM_VALUE = {
  [DEVICE_PARAM_NAME.PROTOCOL]: {
    // HTTP: 'http', // for the future
    MQTT: 'mqtt',
    HTTP: 'http',
  },
};

// Topics
const TOPICS = {
  BASE: 'nuki',
  STATE: 'state',
  LOCK_ACTION: 'lockAction',
  CONNECTED: 'connected',
  BATTERY_CRITICAL: 'batteryCritical',
  BATTERY_CHARGE_STATE: 'batteryChargeState',
  BATTERY_CHARGING: 'batteryCharging',
  DOOR_SENSOR_STATE: 'doorsensorState',
  DOOR_SENSOR_BATTERY_CIRITCAL: 'doorsensorBatteryCritical',
  KEYPAD_BATTERY_CRITICAL: 'keypadBatteryCritical',
};

// 3.3 Lock States (see  MQTT API 1.5.pdf https://developer.nuki.io/uploads/short-url/ysgxlVRSHb9qAFIDQP6eeXr78QF.pdf)
const NUKI_LOCK_STATES = {
  0: 'uncalibrated',
  1: 'locked',
  2: 'unlocking',
  3: 'unlocked',
  4: 'locking',
  5: 'unlatched',
  6: 'unlocked (lock ‘n’ go)',
  7: 'unlatching opening',
  253: 'boot run',
  254: 'motor blocked',
  255: 'undefined',
};

// mapping between Nuki states (labels) and Gladys (integer) lock states
const NUKI_TO_GLADYS_STATE = {
  uncalibrated: LOCK.STATE.ERROR,
  locked: LOCK.STATE.LOCKED,
  unlocking: LOCK.STATE.ACTIVITY,
  unlocked: LOCK.STATE.UNLOCKED,
  locking: LOCK.STATE.ACTIVITY,
  unlatched: LOCK.STATE.UNLOCKED,
  'unlocked (lock ‘n’ go)': LOCK.STATE.UNLOCKED,
  'unlatching opening': LOCK.STATE.ACTIVITY,
  'boot run': LOCK.STATE.ERROR,
  'motor blocked': LOCK.STATE.ERROR,
  undefined: LOCK.STATE.ERROR,
};

// helper that generate the final mapping based on Nuki state
const MAPPING_STATES_NUKI_TO_GLADYS = Object.entries(NUKI_LOCK_STATES).reduce((acc, [code, label]) => {
  acc[code] = NUKI_TO_GLADYS_STATE[label];
  return acc;
}, {});

// mapping between Nuki states (labels) and Gladys (integer) lock states for switch feature
const NUKI_TO_GLADYS_SWITCH = {
  locked: LOCK.STATE.LOCKED,
  locking: LOCK.STATE.LOCKED,
  unlocked: LOCK.STATE.UNLOCKED,
  unlocking: LOCK.STATE.UNLOCKED,
  'unlatching opening': LOCK.STATE.UNLOCKED,
  uncalibrated: LOCK.STATE.ERROR,
  'boot run': LOCK.STATE.ERROR,
  'motor blocked': LOCK.STATE.ERROR,
  undefined: LOCK.STATE.ERROR,
  unlatched: LOCK.STATE.UNLOCKED,
  'unlocked (lock ‘n’ go)': LOCK.STATE.UNLOCKED,
};

// helper that generate the final mapping based on Nuki state labels for switch feature
const MAPPING_SWITCH_NUKI_TO_GLADYS = Object.entries(NUKI_LOCK_STATES).reduce((acc, [code, label]) => {
  acc[code] = NUKI_TO_GLADYS_SWITCH[label] ?? LOCK.STATE.ERROR;
  return acc;
}, {});

// 3.4 Lock Actions (see  MQTT API 1.5.pdf https://developer.nuki.io/uploads/short-url/ysgxlVRSHb9qAFIDQP6eeXr78QF.pdf)
const NUKI_LOCK_ACTIONS = {
  UNLOCK: 1,
  LOCK: 2,
  UNLATCH: 3,
  LOCKNGO: 4,
  LOCKNGO_WITH_UNLATCH: 5,
  FULL_LOCK: 6,
};

const NUKI_TO_GLADYS_ACTIONS = {
  1: LOCK.STATE.UNLOCKED,
  2: LOCK.STATE.LOCKED,
  3: LOCK.STATE.UNLOCKED,
  4: LOCK.STATE.LOCKED,
  5: LOCK.STATE.LOCKED,
  6: LOCK.STATE.LOCKED,
};

// helper that generate the final mapping based on Nuki action codes
const MAPPING_ACTIONS_NUKI_TO_GLADYS = Object.entries(NUKI_LOCK_ACTIONS).reduce((acc, [label, code]) => {
  acc[code] = NUKI_TO_GLADYS_ACTIONS[code];
  return acc;
}, {});

// 3.7 Trigger (see  MQTT API 1.5.pdf https://developer.nuki.io/uploads/short-url/ysgxlVRSHb9qAFIDQP6eeXr78QF.pdf)
const TRIGGER = {
  0: 'system / bluetooth command',
  1: '(reserved)',
  2: 'button',
  3: 'automatic',
  6: 'auto lock',
  171: 'Homekit / Matter',
  172: 'MQTT',
};

const DISCOVERY_TOPIC = 'homeassistant/#'; // this TOPIC is hardcoded in Nuki ...

const DEVICE_EXTERNAL_ID_BASE = 'nuki';

module.exports = {
  DEVICE_EXTERNAL_ID_BASE,
  CONFIGURATION,
  DEVICE_PARAM_NAME,
  DEVICE_PARAM_VALUE,
  TRIGGER,
  DISCOVERY_TOPIC,
  NUKI_LOCK_ACTIONS,
  TOPICS,
  NUKI_LOCK_STATES,
  MAPPING_STATES_NUKI_TO_GLADYS,
  MAPPING_SWITCH_NUKI_TO_GLADYS,
  MAPPING_ACTIONS_NUKI_TO_GLADYS,
};
