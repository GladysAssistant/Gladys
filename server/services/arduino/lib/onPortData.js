const logger = require('../../../utils/logger');
const { DEVICE_FUNCTION } = require('../../../utils/constants');
const { IsJsonString } = require('./isJsonString');
/**
 * @description Arduino onPortData function.
 * @param {Object} data - The data.
 * @param {Object} arduinoManager - The text to send.
 * @param {Object} deviceList - The pulse length.
 * @returns {Promise} - .
 * @example
 * onPortData(data, arduinoManager, deviceList);
 */
async function onPortData(data, arduinoManager, deviceList) {
  logger.warn(data.toString('utf8'));
  if (IsJsonString(data.toString('utf8'))) {
    const messageJSON = JSON.parse(data.toString('utf8'));

    deviceList.forEach(async (device) => {
      const functionName = device.params.find((param) => param.name === 'FUNCTION').value;
      if (functionName === messageJSON.function_name) {
        switch (functionName) {
          case DEVICE_FUNCTION.RECV_433:
            await arduinoManager.gladys.device.setValue(device, device.features[0], messageJSON.parameters.value);
            break;
          case DEVICE_FUNCTION.DHT_TEMPERATURE:
            await arduinoManager.gladys.device.setValue(device, device.features[0], messageJSON.parameters.value);
            break;
          case DEVICE_FUNCTION.DHT_HUMIDITY:
            await arduinoManager.gladys.device.setValue(device, device.features[0], messageJSON.parameters.value);
            break;
          default:
            break;
        }
      }
    });
  }
}

module.exports = {
  onPortData,
};
