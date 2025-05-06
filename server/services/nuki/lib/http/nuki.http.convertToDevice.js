const logger = require('../../../../utils/logger');
const { addSelector } = require('../../../../utils/addSelector');
const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('../utils/nuki.constants');

const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  DEVICE_POLL_FREQUENCIES,
} = require('../../../../utils/constants');

/**
 * @description Discover Nuki devices through HTTP.
 * @param {string} message - HTTP message.
 * @returns {object} Returns Gladys device.
 * @example
 * nukiHTTPHandler.convertToDevice();
 */
function convertToDevice(message) {
  /* Sample message
  {
    smartlockId: 12345678901,
    accountId: 11234567890,
    type: 4,
    lmType: 0,
    authId: 6664212345,
    name: 'MyLock',
    favorite: false,
    config: {
      name: 'Maison',
      latitude: 69.50615,
      longitude: 42.5245657,
      capabilities: 1,
      autoUnlatch: false,
      liftUpHandle: false,
      pairingEnabled: true,
      buttonEnabled: true,
      ledEnabled: true,
      ledBrightness: 2,
      timezoneOffset: 0,
      daylightSavingMode: 0,
      fobPaired: false,
      fobAction1: 4,
      fobAction2: 1,
      fobAction3: 2,
      singleLock: false,
      advertisingMode: 0,
      keypadPaired: false,
      keypad2Paired: false,
      homekitState: 1,
      matterState: 0,
      timezoneId: 37,
      deviceType: 4,
      wifiEnabled: true
    },
    advancedConfig: {
      totalDegrees: 921,
      singleLockedPositionOffsetDegrees: -90,
      unlockedToLockedTransitionOffsetDegrees: 0,
      unlockedPositionOffsetDegrees: 90,
      lockedPositionOffsetDegrees: -90,
      detachedCylinder: false,
      batteryType: 1,
      autoLock: true,
      autoLockTimeout: 600,
      autoUpdateEnabled: true,
      lngTimeout: 30,
      singleButtonPressAction: 1,
      doubleButtonPressAction: 5,
      automaticBatteryTypeDetection: true,
      unlatchDuration: 3
    },
    state: {
      mode: 2,
      state: 1,
      trigger: 3,
      lastAction: 2,
      batteryCritical: false,
      batteryCharging: false,
      batteryCharge: 38,
      keypadBatteryCritical: false,
      doorsensorBatteryCritical: false,
      doorState: 0,
      ringToOpenTimer: 0,
      nightMode: false
    },
    firmwareVersion: 199175,
    hardwareVersion: 1292,
    serverState: 0,
    adminPinState: 0,
    virtualDevice: false,
    creationDate: '2023-10-18T06:43:48.733Z',
    updateDate: '2025-03-29T05:02:44.480Z',
    currentSubscription: {
      type: 'B2C',
      state: 'INACTIVE',
      creationDate: '2023-10-18T06:43:49.518Z'
    }
  }

  */

  const deviceExternalId = message.smartlockId;
  logger.debug(`Id ${deviceExternalId} received mqtt message :  ${message}`);
  delete this.discoveredDevices[deviceExternalId];

  const friendlyName = message.name;

  const externalId = `nuki:${deviceExternalId}`;
  const device = {
    name: friendlyName,
    external_id: externalId,
    selector: externalId,
    features: [],
    model: '',
    service_id: this.nukiHandler.serviceId,
    should_poll: true,
    poll_frequency: DEVICE_POLL_FREQUENCIES.EVERY_SECONDS,
    params: [
      {
        name: DEVICE_PARAM_NAME.PROTOCOL,
        value: DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].HTTP,
      },
    ],
  };
  addSelector(device);

  // battery
  device.features.push({
    name: 'battery',
    selector: `${externalId}:battery`,
    external_id: `${externalId}:battery`,
    category: DEVICE_FEATURE_CATEGORIES.BATTERY,
    type: DEVICE_FEATURE_TYPES.LOCK.INTEGER,
    unit: DEVICE_FEATURE_UNITS.PERCENT,
    read_only: true,
    keep_history: true,
    has_feedback: true,
    min: 0,
    max: 100,
  });

  // lock button
  device.features.push({
    name: 'lock',
    selector: `${externalId}:button`,
    external_id: `${externalId}:button`,
    category: DEVICE_FEATURE_CATEGORIES.LOCK,
    type: DEVICE_FEATURE_TYPES.LOCK.BINARY,
    read_only: false,
    keep_history: true,
    has_feedback: true,
    min: 0,
    max: 1,
  });

  // lock state
  device.features.push({
    name: 'lock-state',
    selector: `${externalId}:state`,
    external_id: `${externalId}:state`,
    category: DEVICE_FEATURE_CATEGORIES.LOCK,
    type: DEVICE_FEATURE_TYPES.LOCK.STATE,
    read_only: true,
    keep_history: true,
    has_feedback: true,
    min: 0,
    max: 255,
  });

  return device;
}

module.exports = {
  convertToDevice,
};
