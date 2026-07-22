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
    const reason = e && e.message ? e.message : e;
    logger.warn(`Unable to poll camera "${device.selector}": ${reason}`);
  }
}

module.exports = {
  poll,
};
