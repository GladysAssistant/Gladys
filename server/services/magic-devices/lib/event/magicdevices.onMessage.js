const logger = require('../../../../utils/logger');
/**
 * @description MagicDevices onMessage callback.
 * @param {Buffer} msg - The message buffer.
 * @param {Object} rsinfo - Rs info.
 * @example
 * magicDevices.onMessage('{"model": "motion"}');
 */
function onMessage(msg, rsinfo) {
  
  logger.debug(msg);


  const message = JSON.parse(msg.toString());
  const ip = rsinfo.address;
  logger.debug(message);
  const data = message.data ? JSON.parse(message.data) : null;
  if (message.sid) {
    // save gateway ip of sensor
    this.gatewayIpBySensorSid.set(message.sid, ip);
    // save sensor model
    this.sensorModelBySensorSid.set(message.sid, message.model);
  }
  switch (message.model) {
    case '86sw1':
      this.newValueSingleWirelessSwitch(message, data);
      break;
    default:
      logger.info(`Xiaomi device "${message.model}" not handled yet!`);
      break;
  }
}

module.exports = {
  onMessage,
};
