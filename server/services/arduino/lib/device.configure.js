const { DEVICE_FUNCTION } = require('../../../utils/constants');
const { getDeviceParam } = require('../../../utils/device');
const logger = require('../../../utils/logger');

/**
 * @description Change value of a device
 * @param {Object} device - The device to configure.
 * @returns {Promise} - .
 * @example
 * configure(device);
 */
async function configure(device) {
  const arduino = await this.gladys.device.getBySelector(getDeviceParam(device, 'ARDUINO_LINKED'));
  const path = getDeviceParam(arduino, 'ARDUINO_PATH');

  let functionName = getDeviceParam(device, 'FUNCTION');

  const message = {
    function_name: functionName,
    parameters: {
      data_pin: getDeviceParam(device, 'DATA_PIN'),
    },
  };

  switch (functionName) {
    case DEVICE_FUNCTION.DHT_TEMPERATURE:
    case DEVICE_FUNCTION.DHT_HUMIDITY:
      functionName = 'recv_dht';
      message.parameters.enable = '1';
      break;
    default:
      logger.debug(`Arduino : Function = "${functionName}" not handled`);
      break;
  }

  if (functionName === 'recv_dht') {
    this.send(path, message, getDeviceParam(device, 'PULSE_LENGTH'));
  }
}

module.exports = {
  configure,
};
