const db = require('../../models');
const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description Save new device feature string state in DB.
 * @param {Object} device - A Device object.
 * @param {Object} deviceFeature - A DeviceFeature object.
 * @param {number} newValue - The new value of the deviceFeature to save.
 * @example
 * saveState({
 *   id: 'fc235c88-b10d-4706-8b59-fef92a7119b2',
 *   selector: 'my-light'
 * }, 'base64/image');
 */
async function saveStringState(device, deviceFeature, newValue) {
  logger.debug(`device.saveStringState of deviceFeature ${deviceFeature.selector}`);

  const now = new Date();
  await db.DeviceFeature.update(
    {
      last_value_string: newValue,
      last_value_changed: now,
    },
    {
      where: {
        id: deviceFeature.id,
      },
    },
  );

  deviceFeature.last_value_string = newValue;
  deviceFeature.last_value_changed = new Date();

  // save local state in RAM
  this.stateManager.setState('deviceFeature', deviceFeature.selector, deviceFeature);

  // send websocket event
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STRING_STATE,
    payload: {
      device: device.selector,
      last_value_string: newValue,
      last_value_changed: now,
    },
  });
}

module.exports = {
  saveStringState,
};
