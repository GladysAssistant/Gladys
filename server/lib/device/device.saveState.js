const db = require('../../models');
const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
const { BadParameters } = require('../../utils/coreErrors');

/**
 * @description Save new device feature state in DB.
 * @param {object} deviceFeature - A DeviceFeature object.
 * @param {number} newValue - The new value of the deviceFeature to save.
 * @example
 * saveState({
 *   id: 'fc235c88-b10d-4706-8b59-fef92a7119b2',
 *   selector: 'my-light'
 * }, 12);
 */
async function saveState(deviceFeature, newValue) {
  if (Number.isNaN(newValue)) {
    throw new BadParameters(`device.saveState of NaN value on ${deviceFeature.selector}`);
  }

  logger.debug(`device.saveState of deviceFeature ${deviceFeature.selector}`);
  const now = new Date();
  const previousDeviceFeature = this.stateManager.get('deviceFeature', deviceFeature.selector);
  const previousDeviceFeatureValue = previousDeviceFeature ? previousDeviceFeature.last_value : null;
  // save local state in RAM
  this.stateManager.setState('deviceFeature', deviceFeature.selector, {
    last_value: newValue,
    last_value_changed: now,
  });
  // update deviceFeature lastValue in DB
  await db.DeviceFeature.update(
    {
      last_value: newValue,
      last_value_changed: now,
    },
    {
      where: {
        id: deviceFeature.id,
      },
    },
  );
  // if the deviceFeature should keep history, we save a new deviceFeatureState
  if (deviceFeature.keep_history) {
    await db.duckDbInsertState(deviceFeature.id, newValue, now);
  }

  // send websocket event
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
    payload: {
      device_feature_selector: deviceFeature.selector,
      last_value: newValue,
      last_value_changed: now,
    },
  });

  // check if there is a trigger matching
  this.eventManager.emit(EVENTS.TRIGGERS.CHECK, {
    type: EVENTS.DEVICE.NEW_STATE,
    device_feature: deviceFeature.selector,
    previous_value: previousDeviceFeatureValue,
    last_value: newValue,
    last_value_changed: now,
  });
}

module.exports = {
  saveState,
};
