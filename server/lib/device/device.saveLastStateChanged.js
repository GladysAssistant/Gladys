const db = require('../../models');
const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description Save new device feature state in DB.
 * @param {Object} deviceFeature - A DeviceFeature object.
 * @example
 * saveLastValueChanged({
 *   id: 'fc235c88-b10d-4706-8b59-fef92a7119b2',
 *   selector: 'my-light'
 * });
 */
async function saveLastStateChanged(deviceFeature) {
  logger.debug(`device.saveLastStateChanged of deviceFeature ${deviceFeature.selector}`);
  const now = new Date();
  // save local state in RAM
  this.stateManager.setState('deviceFeature', deviceFeature.selector, {
    last_value_changed: now,
  });
  await db.DeviceFeature.update(
    {
      last_value_changed: now,
    },
    {
      where: {
        id: deviceFeature.id,
      },
    },
  );

  // send websocket event
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE_NO_CHANGED,
    payload: {
      device_feature_selector: deviceFeature.selector,
      last_value_changed: now,
    },
  });
}

module.exports = {
  saveLastStateChanged,
};
