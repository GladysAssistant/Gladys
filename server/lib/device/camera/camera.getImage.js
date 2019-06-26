const { NotFoundError } = require('../../../utils/coreErrors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

/**
 * @description Get image of a camera.
 * @param {string} selector - Selector of the camera.
 * @example
 * camera.getImage('test-camera');
 */
async function getImage(selector) {
  const device = this.stateManager.get('device', selector);
  if (device === null) {
    throw new NotFoundError('Camera not found');
  }
  const deviceFeature = device.features.find(
    (dF) => dF.category === DEVICE_FEATURE_CATEGORIES.CAMERA && dF.type === DEVICE_FEATURE_TYPES.CAMERA.IMAGE,
  );
  if (!deviceFeature) {
    throw new NotFoundError('Camera image feature not found');
  }
  return Promise.resolve(deviceFeature.last_value_string);
}

module.exports = {
  getImage,
};
