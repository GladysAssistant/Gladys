const VARIABLES = {
  ENABLED: 'MATTER_BRIDGE_ENABLED',
  PASSCODE: 'MATTER_BRIDGE_PASSCODE',
  DISCRIMINATOR: 'MATTER_BRIDGE_DISCRIMINATOR',
  SERIAL_NUMBER: 'MATTER_BRIDGE_SERIAL_NUMBER',
  EXPOSURE_MODE: 'MATTER_BRIDGE_EXPOSURE_MODE',
  EXPOSED_DEVICES: 'MATTER_BRIDGE_EXPOSED_DEVICES',
};

// Which devices the bridge exposes: every compatible one, or only those the user picked.
const EXPOSURE_MODES = {
  ALL: 'all',
  SELECTION: 'selection',
};

// The Matter controller of the `matter` service listens on the default Matter port (5540): the
// bridge is a second Matter node in the same process, so it needs a port of its own.
const MATTER_BRIDGE_PORT = 5541;

const NODE_ID = 'gladys-matter-bridge';
const AGGREGATOR_ID = 'aggregator';

// Test vendor and product ids, the ones the Matter specification reserves for uncertified
// products. Every ecosystem accepts them, after a warning that the accessory is not certified.
const VENDOR_ID = 0xfff1;
const PRODUCT_ID = 0x8000;

// Passcodes the Matter specification (5.1.7.1) forbids because they are too easy to guess.
const INVALID_PASSCODES = [
  0,
  11111111,
  22222222,
  33333333,
  44444444,
  55555555,
  66666666,
  77777777,
  88888888,
  99999999,
  12345678,
  87654321,
];
const MAX_PASSCODE = 99999998;
const MAX_DISCRIMINATOR = 4095;

// Matter BridgedDeviceBasicInformation strings are limited to 32 characters.
const MAX_LABEL_LENGTH = 32;

// A level or colour change made from a Matter app arrives as a series of attribute changes (a
// slider being dragged, a transition). Only the last one is forwarded to the Gladys device.
const COMMAND_DEBOUNCE_MS = 300;

// Matter enums, by their numeric values from the Matter specification. They are kept here rather
// than read from matter.js so the adapters stay plain data that tests can check without it.
const COLOR_MODE = {
  HUE_SATURATION: 0,
  XY: 1,
  COLOR_TEMPERATURE: 2,
};

const MOVEMENT_TYPE = {
  LIFT: 0,
  TILT: 1,
};

// WindowCovering operational status of a movement.
const MOVEMENT_STATUS = {
  STOPPED: 0,
  OPENING: 1,
  CLOSING: 2,
};

const MOVEMENT_DIRECTION = {
  OPEN: 0,
  CLOSE: 1,
  DEFINED_BY_POSITION: 2,
};

const WINDOW_COVERING_TYPE = {
  ROLLERSHADE: 0,
  DRAPERY: 4,
};

const END_PRODUCT_TYPE = {
  CENTRAL_CURTAIN: 16,
  ROLLER_SHUTTER: 17,
};

const ALARM_STATE = {
  NORMAL: 0,
  CRITICAL: 2,
};

const EXPRESSED_STATE = {
  NORMAL: 0,
  SMOKE_ALARM: 1,
  CO_ALARM: 2,
};

const BAT_CHARGE_LEVEL = {
  OK: 0,
  WARNING: 1,
  CRITICAL: 2,
};

const POWER_SOURCE_STATUS = {
  ACTIVE: 1,
};

const MEASUREMENT_UNIT = {
  PPM: 0,
  UGM3: 4,
};

const MEASUREMENT_MEDIUM = {
  AIR: 0,
};

const AIR_QUALITY = {
  UNKNOWN: 0,
  GOOD: 1,
  FAIR: 2,
  MODERATE: 3,
  POOR: 4,
  VERY_POOR: 5,
  EXTREMELY_POOR: 6,
};

module.exports = {
  VARIABLES,
  EXPOSURE_MODES,
  MATTER_BRIDGE_PORT,
  NODE_ID,
  AGGREGATOR_ID,
  VENDOR_ID,
  PRODUCT_ID,
  INVALID_PASSCODES,
  MAX_PASSCODE,
  MAX_DISCRIMINATOR,
  MAX_LABEL_LENGTH,
  COMMAND_DEBOUNCE_MS,
  COLOR_MODE,
  MOVEMENT_TYPE,
  MOVEMENT_STATUS,
  MOVEMENT_DIRECTION,
  WINDOW_COVERING_TYPE,
  END_PRODUCT_TYPE,
  ALARM_STATE,
  EXPRESSED_STATE,
  BAT_CHARGE_LEVEL,
  POWER_SOURCE_STATUS,
  MEASUREMENT_UNIT,
  MEASUREMENT_MEDIUM,
  AIR_QUALITY,
};
