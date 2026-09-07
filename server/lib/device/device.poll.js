const get = require('get-value');
const { NotFoundError } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');
const { isCameraEnabled } = require('../../utils/device');

/**
 * @description Poll a device to get new value.
 * @param {object} device - The device which is going to be polled.
 * @example
 * poll(device);
 */
async function poll(device) {
  logger.debug(`Polling device ${device.selector}`);
  // A disabled camera must not be polled at all: this is the whole point of the "enabled"
  // gate (a camera unplugged for the winter otherwise floods the logs with poll errors).
  if (!isCameraEnabled(device)) {
    logger.debug(`Device ${device.selector} is a disabled camera, skipping poll`);
    return;
  }
  const service = this.serviceManager.getService(device.service.name);
  if (service === null) {
    throw new NotFoundError(`Service ${device.service.name} was not found.`);
  }
  if (typeof get(service, 'device.poll') !== 'function') {
    throw new NotFoundError(`Service ${device.service.name} does not have a device.poll function.`);
  }
  try {
    await service.device.poll(device);
  } catch (e) {
    logger.error(`There was an error while polling device ${device.selector}`);
    logger.error(e);
  }
}

module.exports = {
  poll,
};
