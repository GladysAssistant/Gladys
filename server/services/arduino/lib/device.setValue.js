const { DEVICE_FEATURE_TYPES, DEVICE_FUNCTION } = require('../../../utils/constants');

const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');

/**
 * @description Change value of a device
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @param {string|number} value - The new value.
 * @example
 * setValue(device, deviceFeature, value);
 */
async function setValue(device, deviceFeature, value) {
  //Récupérer l'Arduino rattaché au device                                                    --OK
  const arduinoSelectorIndex = device.params.findIndex((param) => param.name === 'ARDUINO_LINKED');
  const arduinoSelector = device.params[arduinoSelectorIndex].value;
  const arduino = await this.gladys.device.getBySelector(arduinoSelector);

  //En récupérer son path                                                                     --OK
  const pathIndex = arduino.params.findIndex((param) => param.name === 'ARDUINO_PATH');
  const path = arduino.params[pathIndex].value;

  //Créer le JSON, message qui sera à transmettre à l'Arduino
  const functionName = device.params.find((param) => param.name === 'FUNCTION').value;

  var message = {
    function_name: functionName,
    parameters: {
      data_pin: device.params.find((param) => param.name === 'DATA_PIN').value,
    },
  };

  switch (functionName) {
    case DEVICE_FUNCTION.EMIT_433:
      message.parameters['code'] = device.params.find((param) => param.name === 'CODE').value;
      message.parameters['bit_length'] = device.params.find((param) => param.name === 'BIT_LENGTH').value;
      break;
    case DEVICE_FUNCTION.EMIT_433_CHACON:
      if (value === 1) {
        message.parameters['code'] = device.params.find((param) => param.name === 'CODE_ON').value;
      } else if (value === 0) {
        message.parameters['code'] = device.params.find((param) => param.name === 'CODE_OFF').value;
      }
    case DEVICE_FUNCTION.EMIT_IR:
      message.parameters['code'] = device.params.find((param) => param.name === 'CODE').value;
      break;
    default:
      logger.debug(`Arduino : Function = "${functionName}" not handled`);
      break;
  }

  logger.debug(message);
}

module.exports = {
  setValue,
};
