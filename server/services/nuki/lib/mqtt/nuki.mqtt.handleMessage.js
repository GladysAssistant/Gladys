const logger = require('../../../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../../../utils/constants');

const { LOCK_STATES, TRIGGER } = require('../utils/nuki.constants');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {object} message - The message sent.
 * @example
 * nukiMQTTHandler.handleMessage('nuki/438166F4/deviceType', '4');
 */
function handleMessage(topic, message) {
  const [main, deviceType, feature] = topic.split('/');

  let device;
  if (main === 'homeassistant') {
    logger.debug(topic, deviceType);
    device = this.convertToDevice(message);
    this.discoveredDevices[device.external_id] = device;
    this.nukiHandler.notifyNewDevice(device, WEBSOCKET_MESSAGE_TYPES.NUKI.NEW_MQTT_DEVICE);
  } else if (main === 'nuki') {
    let externalId;
    const { gladys } = this.nukiHandler;

    switch (feature) {
      case 'batteryChargeState': {
        externalId = `${main}:${deviceType}:battery`;
        gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: externalId,
          state: Math.round(message),
        });
        break;
      }
      case 'state': {
        // 3.3 Lock States
        const state = Math.round(message);
        logger.info(`Lock state has changed : ${LOCK_STATES[state]}`);
        externalId = `${main}:${deviceType}:button`;
        const binaryValue = LOCK_STATES[state] === 'locked' ? 0 : 1;
        gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: externalId,
          state: binaryValue,
        });
        externalId = `${main}:${deviceType}:state`;
        gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: externalId,
          state,
        });
        break;
      }
      case 'commandResponse': {
        // 0 = Success
        // 1-255 = Error code as described in the BLE API.
        if (message !== 0) {
          logger.error(`Error command response : ${message}`);
        }
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
        const [lockAction, trigger, authId, codeId, autoLock] = message.split(',');
        logger.debug(
          `Lock action (${lockAction} via ${TRIGGER[trigger]}) with Auth-ID  ${authId} from Code-ID ${codeId} (if keypad) (Auto-unlock or number of button presses ${autoLock})`,
        );
        const binaryValue = lockAction === 2 ? 1 : 0;
        const newState = {
          device_feature_external_id: `${main}:${deviceType}:button`,
          state: binaryValue,
        };
        gladys.event.emit(EVENTS.DEVICE.NEW_STATE, newState);
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
