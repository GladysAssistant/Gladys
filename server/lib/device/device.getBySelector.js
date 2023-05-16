const { NotFoundError } = require('../../utils/coreErrors');

/**
 * @description Get a device by selector.
 * @param {string} selector - Device selector.
 * @returns {Promise<object>} Resolve with device.
 * @example
 * device.getBySelector('test-devivce');
 */
function getBySelector(selector) {
  const device = this.stateManager.get('device', selector);

  if (device === null) {
    throw new NotFoundError('Device not found');
  }

  return device;
}

module.exports = {
  getBySelector,
};
