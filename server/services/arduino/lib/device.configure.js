const { DEVICE_FUNCTION } = require('../../../utils/constants');

const logger = require('../../../utils/logger');

const { send } = require('./send');

/**
 * @description Change value of a device
 * @param {Object} device - The device to configure.
 * @returns - .
 * @example
 * configure(device);
 */
async function configure(device) {
  const arduino = await this.gladys.device.getBySelector(
    device.params.find((param) => param.name === 'ARDUINO_LINKED').value,
  );
  const path = arduino.params.find((param) => param.name === 'ARDUINO_PATH').value;

  let functionName = device.params.find((param) => param.name === 'FUNCTION').value;

  if (functionName === DEVICE_FUNCTION.DHT_HUMIDITY || functionName === DEVICE_FUNCTION.DHT_TEMPERATURE) {
    functionName = 'recv_dht';
  }

  const message = {
    function_name: functionName,
    parameters: {
      data_pin: device.params.find((param) => param.name === 'DATA_PIN').value,
    },
  };

  switch (functionName) {
    case 'recv_dht':
      message.parameters['enable'] = '1';
      break;
    case DEVICE_FUNCTION.DHT_HUMIDITY:
      message.parameters['enable'] = '1';
      break;
    default:
      logger.debug(`Arduino : Function = "${functionName}" not handled`);
      break;
  }

  if (functionName === 'recv_dht') {
    send(path, message, device.params.find((param) => param.name === 'PULSE_LENGTH').value);
  }
}

module.exports = {
  configure,
};
