const logger = require('../../../utils/logger');
const serial = require('serialport');

/**
 * @description Send a message to the Arduino
 * @param {Object} device - The Arduino device.
 * @example
 * send(device);
 */
async function send(device) {
  try {
    const path = device.params.findIndex((param) => param.name === 'ARDUINO_PATH');
    var message = 'test';

    //const cameraImage = await this.getImage(device);
    //await this.gladys.device.camera.setImage(device.selector, cameraImage);
  } catch (e) {
    logger.warn('Unable to send message');
    logger.debug(e);
  }
}

module.exports = {
  send,
};
