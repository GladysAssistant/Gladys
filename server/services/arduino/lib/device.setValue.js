const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FUNCTION, STATE } = require('../../../utils/constants');
const { getDeviceParam } = require('../../../utils/device');
const logger = require('../../../utils/logger');

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
  const arduino = await this.gladys.device.getBySelector(getDeviceParam(device, 'ARDUINO_LINKED'));
  const path = getDeviceParam(arduino, 'ARDUINO_PATH');

  const functionName = getDeviceParam(device, 'FUNCTION');

  const message = {
    function_name: functionName,
    parameters: {
      data_pin: getDeviceParam(device, 'DATA_PIN'),
    },
  };

  switch (functionName) {
    case DEVICE_FUNCTION.RECV_433:
      if (
        (deviceFeature.category === DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR ||
          deviceFeature.category === DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR) &&
        parseInt(getDeviceParam(device, 'CODE'), 0) === parseInt(value, 0)
      ) {
        this.gladys.device.setValue(device, deviceFeature, STATE.ON);
      }
      break;
    case DEVICE_FUNCTION.DHT_TEMPERATURE:
    case DEVICE_FUNCTION.DHT_HUMIDITY:
      message.function_name = 'recv_dht';
      break;
    case DEVICE_FUNCTION.EMIT_433:
      switch (device.features[0].type) {
        case DEVICE_FEATURE_TYPES.SWITCH.BINARY:
          message.parameters.code =
            value === 1 ? getDeviceParam(device, 'CODE_ON') : getDeviceParam(device, 'CODE_OFF');
          break;
        case DEVICE_FEATURE_TYPES.SENSOR.PUSH:
          message.parameters.code = getDeviceParam(device, 'CODE');
          break;
        default:
          break;
      }

      message.parameters.bit_length = getDeviceParam(device, 'BIT_LENGTH');
      break;

    case DEVICE_FUNCTION.EMIT_433_CHACON:
      message.parameters.code = value === 1 ? getDeviceParam(device, 'CODE_ON') : getDeviceParam(device, 'CODE_OFF');
      break;

    case DEVICE_FUNCTION.EMIT_IR:
      switch (device.features[0].type) {
        case DEVICE_FEATURE_TYPES.SWITCH.BINARY:
          message.parameters.code =
            value === 1 ? getDeviceParam(device, 'CODE_ON') : getDeviceParam(device, 'CODE_OFF');
          break;
        case DEVICE_FEATURE_TYPES.SENSOR.PUSH:
          message.parameters.code = getDeviceParam(device, 'CODE');
          break;
        default:
          break;
      }

      message.parameters.bit_length = getDeviceParam(device, 'BIT_LENGTH');
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
    this.send(path, message, getDeviceParam(device, 'PULSE_LENGTH'));
  }
}

module.exports = {
  setValue,
};
