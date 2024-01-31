const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {object} message - The message sent.
 * @example
 * nukiMQTTHandler.handleMessage('nuki/438166F4/deviceType', '4');
 */
function handleMessage(topic, message) {
  const [main, deviceType, feature] = topic.split('/');

  logger.trace(main, deviceType, feature);
  // logger.trace(`NUKI TOPIC ${topic}`);
  // logger.trace(`NUKI MESSAGE ${message}`);
  let device;
  if (main === 'homeassistant') {
      logger.trace(topic, deviceType);
      device = this.convertToDevice(message);
      this.discoveredDevices[device.external_id] = device;
      // logger.trace(device);
      this.nukiHandler.notifyNewDevice(device, WEBSOCKET_MESSAGE_TYPES.NUKI.NEW_MQTT_DEVICE);
  } else if (main === 'nuki') {
    let externalId;
    const gladys = this.nukiHandler.gladys;

    switch (feature) {
      case 'batteryChargeState': {
        logger.trace(feature, message);
        externalId = `${main}:${deviceType}:battery`;
        gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: externalId,
          state: Math.round(message),
        });
        break;
      }
      case 'state': {
        logger.trace(feature, message);
        externalId = `${main}:${deviceType}:button`;
        gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: externalId,
          state: Math.round(message),
        });
        externalId = `${main}:${deviceType}:state`;
        gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: externalId,
          state: Math.round(message),
        });
        break;
      }
      case 'commandResponse': {
        // 0 = Success
        // 1-255 = Error code as described in the BLE API.
        logger.trace(feature, message);
        break;
      }
      case 'lockActionEvent': {
        /* 1,172,0,0,0
        *  ● LockAction
        *  ● Trigger
        *  ● Auth-ID: Auth-ID of the user
        *  ● Code-ID: ID of the Keypad code, 0 = unknown
        *  ● Auto-Unlock (0 or 1) or number of button presses (only
        *    button & fob actions) or Keypad source (0 = back key, 1 =
        *    code, 2 = fingerprint)
        *  ● Only lock actions that are attempted to be executed are reported. 
        *    E.g. unsuccessful Keypad code entries or lock commands
        *    outside of a time window are not published.
        */
        logger.trace(feature, message);
        break;
      }
      default: {
        logger.debug(`MQTT : Nuki feature "${feature}" not handled.`);
      }
    }
  } else {
    logger.debug(`MQTT : Nuki topic "${topic}" not handled.`);
  }
}

module.exports = {
  handleMessage,
};
