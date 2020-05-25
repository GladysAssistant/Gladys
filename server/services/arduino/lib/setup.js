const Avrgirl = require('avrgirl-arduino');
const path = require('path');
const logger = require('../../../utils/logger');

/**
 * @description Setup the Arduino and copy the code in it.
 * @param {Object} device - The Arduino device.
 * @returns - Error if flashing is impossible.
 * @example
 * setup(device);
 */
async function setup(device) {
  try {
    const arduinoPath = device.params.find((param) => param.name === 'ARDUINO_PATH').value;
    const model = device.params.find((param) => param.name === 'ARDUINO_MODEL').value;

    const avrgirl = new Avrgirl({
      board: model,
      path: arduinoPath,
    });

    avrgirl.flash(path.resolve(`services/arduino/arduino-code/`, `${model}/arduino-code.ino.hex`), function(error) {
      if (error) {
        logger.warn(error);
        return new Error(error);
      }
      return 0;
    });
  } catch (e) {
    logger.warn('Unable to flash the card');
    logger.debug(e);
  }
}

module.exports = {
  setup,
};
