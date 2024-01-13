const logger = require('../../../../utils/logger');
const { WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('../utils/nuki.constants');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {object} message - The message sent.
 * @example
 * handleMessage('nuki/438166F4/deviceType', '4');
 */
function handleMessage(topic, message) {
  const [main, deviceType, feature] = topic.split('/');

  logger.trace(main, deviceType, feature);
  // logger.trace(`NUKI TOPIC ${topic}`);
  // logger.trace(`NUKI MESSAGE ${message}`);

  switch (main) {
    case 'homeassistant':
      logger.trace(topic, deviceType);
      const device = this.convertToDevice(message);
      this.discoveredDevices[device.external_id] = device;
      logger.trace(device);
      
      break;
    
    // 
    case 'STATUS8': {
      
      break;
    }
    default: {
      logger.debug(`MQTT : Nuki topic "${topic}" not handled.`);
    }
  }
}

module.exports = {
  handleMessage,
};
