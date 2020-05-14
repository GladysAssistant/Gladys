const logger = require('../../../utils/logger');
const Avrgirl = require('avrgirl-arduino');

/**
 * @description Setup the Arduino and copy the code in it.
 * @param {Object} arduinoPath - The Arduino path.
 * @example
 * setup(path);
 */
async function setup(device) {
  try {
    const arduinoPath = device.params.find((param) => param.name === 'ARDUINO_PATH').value;
    const model = device.params.find((param) => param.name === 'ARDUINO_MODEL').value;
    
    var avrgirl = new Avrgirl({
      board: model,
      path: arduinoPath,
    });

    avrgirl.flash('../arduino-code/arduino-code.ino.standard.hex', function (error) {
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
