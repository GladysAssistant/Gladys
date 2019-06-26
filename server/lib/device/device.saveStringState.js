const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Save new device feature string state in DB.
 * @param {Object} deviceFeature - A DeviceFeature object.
 * @param {number} newValue - The new value of the deviceFeature to save.
 * @example
 * saveState({
 *   id: 'fc235c88-b10d-4706-8b59-fef92a7119b2',
 *   selector: 'my-light'
 * }, 'base64/image');
 */
async function saveStringState(deviceFeature, newValue) {
  logger.debug(`device.saveStringState of deviceFeature ${deviceFeature.selector}`);

  await db.DeviceFeature.update(
    {
      last_value_string: newValue,
      last_value_changed: new Date(),
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
}

module.exports = {
  saveStringState,
};
