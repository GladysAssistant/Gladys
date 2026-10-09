const { NotFoundError, BadParameters } = require('../../../utils/coreErrors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { isCameraEnabled } = require('../../../utils/device');
const logger = require('../../../utils/logger');

// Image should be small
const MAX_SIZE_IMAGE = 150 * 1024;

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
  // A disabled camera stores no new image: images pushed by an integration while the camera is
  // off would be served again as soon as it is turned back on, which would defeat the purpose
  // of the "private mode" (spec docs/specs/camera-enable-disable.md).
  if (!isCameraEnabled(device)) {
    throw new NotFoundError('Camera is disabled');
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
