const logger = require('../../../utils/logger');
const Avrgirl = require('avrgirl-arduino');

/**
 * @description Setup the Arduino and copy the code in it.
 * @param {Object} device - The Arduino device.
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

    avrgirl.flash(require.resolve(`${model}/arduino-code.ino.standard.hex`), function (error) {
      if (error) {
        logger.warn(error);
      } else {
        logger.warn('Flashing done!');
      }
    });
  } catch (e) {
    logger.warn('Unable to flash the card');
    logger.debug(e);
  }
}

module.exports = {
  setup,
};
