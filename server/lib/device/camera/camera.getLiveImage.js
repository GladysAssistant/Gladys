const { NotFoundError, ServiceNotConfiguredError } = require('../../../utils/coreErrors');

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
