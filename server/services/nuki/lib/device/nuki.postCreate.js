const logger = require('../../../../utils/logger');
const { DEVICE_PARAM_NAME, DEVICE_PARAM_VALUE } = require('../utils/nuki.constants');

/**
 * @description Nuki device post creation action : if mqtt, subscribe.
 * @param {object} device - The created device.
 * @example
 * postCreate(device)
 */
function postCreate(device) {
  logger.debug(`Post creation of ${device.external_id}`);
  const protocol = this.getProtocolFromDevice(device);
  if (protocol === DEVICE_PARAM_VALUE[DEVICE_PARAM_NAME.PROTOCOL].MQTT) {
    const mqttHandler = this.getHandler(protocol);
    mqttHandler.subscribeDeviceTopic(device);
  }
}

module.exports = {
  postCreate,
};
