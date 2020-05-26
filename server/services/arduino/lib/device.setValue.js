const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FUNCTION } = require('../../../utils/constants');

const logger = require('../../../utils/logger');

const { send } = require('./send');

/**
 * @description Change value of a device.
 * @param {Object} device - The device to control.
 * @param {Object} deviceFeature - The binary deviceFeature to control.
 * @param {string|number} value - The new value.
 * @returns {Promise} - .
 * @example
 * setValue(device, deviceFeature, value);
 */
async function setValue(device, deviceFeature, value) {
  const arduino = await this.gladys.device.getBySelector(
    device.params.find((param) => param.name === 'ARDUINO_LINKED').value,
  );
  const path = arduino.params.find((param) => param.name === 'ARDUINO_PATH').value;

  const functionName = device.params.find((param) => param.name === 'FUNCTION').value;

  const message = {
    function_name: functionName,
    parameters: {
      data_pin: device.params.find((param) => param.name === 'DATA_PIN').value,
    },
  };

  switch (functionName) {
    case DEVICE_FUNCTION.RECV_433:
      // message.parameters['enable'] = value === 1 ? true : false;
      if (
        device.features[0].category === DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR &&
        device.params.find((param) => param.name === 'CODE').value === value
      ) {
        this.gladys.device.setValue(device, deviceFeature, 1);
      }
      break;
    case DEVICE_FUNCTION.DHT_TEMPERATURE:
      message.function_name = 'recv_dht';
      break;
    case DEVICE_FUNCTION.DHT_HUMIDITY:
      message.function_name = 'recv_dht';
      break;
    case DEVICE_FUNCTION.EMIT_433:
      switch (device.features[0].type) {
        case DEVICE_FEATURE_TYPES.SWITCH.BINARY:
          message.parameters.code =
            value === 1
              ? device.params.find((param) => param.name === 'CODE_ON').value
              : device.params.find((param) => param.name === 'CODE_OFF').value;
          break;
        case DEVICE_FEATURE_TYPES.SENSOR.PUSH:
          message.parameters.code = device.params.find((param) => param.name === 'CODE').value;
          break;
        default:
          break;
      }

      message.parameters.bit_length = device.params.find((param) => param.name === 'BIT_LENGTH').value;
      break;

    case DEVICE_FUNCTION.EMIT_433_CHACON:
      message.parameters.code =
        value === 1
          ? device.params.find((param) => param.name === 'CODE_ON').value
          : device.params.find((param) => param.name === 'CODE_OFF').value;
      break;

    case DEVICE_FUNCTION.EMIT_IR:
      switch (device.features[0].type) {
        case DEVICE_FEATURE_TYPES.SWITCH.BINARY:
          message.parameters.code =
            value === 1
              ? device.params.find((param) => param.name === 'CODE_ON').value
              : device.params.find((param) => param.name === 'CODE_OFF').value;
          break;
        case DEVICE_FEATURE_TYPES.SENSOR.PUSH:
          message.parameters.code = device.params.find((param) => param.name === 'CODE').value;
          break;
        default:
          break;
      }

      message.parameters.bit_length = device.params.find((param) => param.name === 'BIT_LENGTH').value;
      break;
    default:
      logger.debug(`Arduino : Function = "${functionName}" not handled`);
      break;
  }

  if (
    functionName !== DEVICE_FUNCTION.RECV_433 &&
    functionName !== DEVICE_FUNCTION.DHT_HUMIDITY &&
    functionName !== DEVICE_FUNCTION.DHT_TEMPERATURE
  ) {
    send(path, message, device.params.find((param) => param.name === 'PULSE_LENGTH').value);
  }
}

module.exports = {
  setValue,
};
