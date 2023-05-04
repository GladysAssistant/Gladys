const logger = require('../../../utils/logger');

/**
 * @description Poll a camera.
 * @param {object} device - The camera to poll.
 * @example
 * poll(device);
 */
async function poll(device) {
  try {
    const cameraImage = await this.getImage(device);
    await this.gladys.device.camera.setImage(device.selector, cameraImage);
  } catch (e) {
    logger.warn('Unable to poll camera');
    logger.debug(e);
  }
}

module.exports = {
  poll,
};
