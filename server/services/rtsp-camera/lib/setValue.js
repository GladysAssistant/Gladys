const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');
const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

/**
 * @description Set a value on a RTSP camera feature.
 * RTSP has no control channel, so the only writable feature of a RTSP camera is the "enabled"
 * gate (spec docs/specs/camera-enable-disable.md): its state is owned and enforced by Gladys
 * itself (polling, live view, image), there is nothing to send to the camera. Disabling the
 * camera stops the live stream immediately, so a dashboard already streaming stops right away.
 * @param {object} device - The camera.
 * @param {object} deviceFeature - The feature to set.
 * @param {number} value - The new value.
 * @returns {Promise} Resolve when the value was handled.
 * @example
 * setValue(device, deviceFeature, 0);
 */
async function setValue(device, deviceFeature, value) {
  if (
    deviceFeature.category !== DEVICE_FEATURE_CATEGORIES.CAMERA ||
    deviceFeature.type !== DEVICE_FEATURE_TYPES.CAMERA.ENABLED
  ) {
    throw new NotFoundError(`RTSP camera: feature ${deviceFeature.category}/${deviceFeature.type} is not writable.`);
  }
  if (value === 0) {
    logger.info(`RTSP camera ${device.selector} was disabled, stopping any live stream.`);
    await this.stopStreaming(device.selector);
    return;
  }
  logger.info(`RTSP camera ${device.selector} was enabled.`);
}

module.exports = {
  setValue,
};
