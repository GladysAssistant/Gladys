const { NotFoundError } = require('../../../utils/coreErrors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { isNumeric } = require('../../../utils/device');

const CAMERA_IMAGE_EXPIRATION_TIME_IN_HOURS = 1;

/**
 * @description Get image of a camera.
 * @param {string} selector - Selector of the camera.
 * @returns {Promise} Resolve with camera image.
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
  let lastValueInTimestamp = new Date(deviceFeature.last_value_changed).getTime();
  if (!isNumeric(lastValueInTimestamp)) {
    lastValueInTimestamp = 0;
  }
  const tooOldTimestamp = Date.now() - CAMERA_IMAGE_EXPIRATION_TIME_IN_HOURS * 60 * 60 * 1000;
  const lastValueIsToOld = lastValueInTimestamp < tooOldTimestamp;
  if (lastValueIsToOld) {
    throw new NotFoundError('Camera image is too old');
  }
  return Promise.resolve(deviceFeature.last_value_string);
}

module.exports = {
  getImage,
};
