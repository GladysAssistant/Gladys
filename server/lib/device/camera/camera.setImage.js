const { NotFoundError, BadParameters } = require('../../../utils/coreErrors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const logger = require('../../../utils/logger');

// Image should be < 75ko
const MAX_SIZE_IMAGE = 75 * 1024;

/**
 * @description Set image of a camera.
 * @param {string} selector - Selector of the camera.
 * @param {string} image - Image in base64.
 * @returns {Promise} Resolve when image has been set.
 * @example
 * camera.setImage('test-camera', 'sfdsf');
 */
async function setImage(selector, image) {
  if (image.length > MAX_SIZE_IMAGE) {
    throw new BadParameters('Image is too big');
  }
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
  logger.debug(`Camera.setImage :  New image for camera ${selector}`);
  await this.deviceManager.saveStringState(device, deviceFeature, image);
  return null;
}

module.exports = {
  setImage,
};
