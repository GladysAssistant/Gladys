const logger = require('../../../utils/logger');

const { recv } = require('./recv');

/**
 * @description Poll a camera
 * @param {Object} device - The device to poll.
 * @example
 * poll(device);
 */
async function poll(device) {
  try {
    logger.warn("I'm actually polling !!!");

    const arduino = await this.gladys.device.getBySelector(
      device.params.find((param) => param.name === 'ARDUINO_LINKED').value
    );
    const arduinoPath = arduino.params.find((param) => param.name === 'ARDUINO_PATH').value;
    logger.warn(arduinoPath);
    //recv(device);
  } catch (e) {
    logger.warn('Unable to poll device');
    logger.debug(e);
  }
}

module.exports = {
  poll,
};
