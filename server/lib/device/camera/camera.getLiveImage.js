const { NotFoundError, ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const { isCameraEnabled } = require('../../../utils/device');

/**
 * @description Get live image of a camera.
 * @param {string} selector - Selector of the camera.
 * @returns {Promise} Resolve with camera image.
 * @example
 * camera.getLiveImage('test-camera');
 */
async function getLiveImage(selector) {
  const device = this.stateManager.get('device', selector);
  if (device === null) {
    throw new NotFoundError('Camera not found');
  }

  // A disabled camera is never asked for a fresh image (dashboard live view, chat intent,
  // scene "send camera image") — spec docs/specs/camera-enable-disable.md.
  if (!isCameraEnabled(device)) {
    throw new NotFoundError('Camera is disabled');
  }

  const service = this.serviceManager.getServiceById(device.service_id);
  if (service === null) {
    throw new ServiceNotConfiguredError(`Service is not found or not configured.`);
  }
  const image = await service.device.getImage(device);

  return Promise.resolve(image);
}

module.exports = {
  getLiveImage,
};
