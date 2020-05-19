const { DEVICE_FEATURE_TYPES, DEVICE_FUNCTION } = require('../../../utils/constants');

const logger = require('../../../utils/logger');
const { NotFoundError } = require('../../../utils/coreErrors');

const { send } = require('./send');

/**
 * @description Change value of a device
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @param {string|number} value - The new value.
 * @example
 * setValue(device, deviceFeature, value);
 */
async function setValue(device, deviceFeature, value) {
  const arduino = await this.gladys.device.getBySelector(
    device.params.find((param) => param.name === 'ARDUINO_LINKED').value
  );
  const path = arduino.params.find((param) => param.name === 'ARDUINO_PATH').value;

  //Créer le JSON, message qui sera à transmettre à l'Arduino
  const functionName = device.params.find((param) => param.name === 'FUNCTION').value;

  var message = {
    function_name: functionName,
    parameters: {
      data_pin: device.params.find((param) => param.name === 'DATA_PIN').value,
    },
  };

  switch (functionName) {
    case DEVICE_FUNCTION.RECV_433:
      message.parameters['enable'] = value === 1 ? 'true' : 'false';
      break;
    case DEVICE_FUNCTION.EMIT_433:
      message.parameters['code'] = device.params.find((param) => param.name === 'CODE').value;
      message.parameters['bit_length'] = device.params.find((param) => param.name === 'BIT_LENGTH').value;
      break;
    case DEVICE_FUNCTION.EMIT_433_CHACON:
      message.parameters['code'] =
        value === 1
          ? device.params.find((param) => param.name === 'CODE_ON').value
          : device.params.find((param) => param.name === 'CODE_OFF').value;
      break;
    case DEVICE_FUNCTION.EMIT_IR:
      message.parameters['code'] = device.params.find((param) => param.name === 'CODE').value;
      message.parameters['bit_length'] = device.params.find((param) => param.name === 'BIT_LENGTH').value;
      break;
    default:
      logger.debug(`Arduino : Function = "${functionName}" not handled`);
      break;
  }

  send(path, message, device.params.find((param) => param.name === 'PULSE_LENGTH').value);
}

module.exports = {
  setValue,
};
