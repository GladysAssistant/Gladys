const CONFIGURATION = {
  NUKI_LOGIN_KEY: 'NUKI_LOGIN',
  NUKI_PASSWORD_KEY: 'NUKI_PASSWORD',
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

const LOCK_STATES = {
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
  255: 'undefined'
};

const DISCOVERY_TOPIC = 'homeassistant/#'; // this TOPIC is hardcoded in Nuki ...

const DEVICE_EXTERNAL_ID_BASE = 'nuki';

module.exports = {
  DEVICE_EXTERNAL_ID_BASE,
  CONFIGURATION,
  DEVICE_PARAM_NAME,
  DEVICE_PARAM_VALUE,
  DISCOVERY_TOPIC,
  TOPICS,
  LOCK_STATES
};