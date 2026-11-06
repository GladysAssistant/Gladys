const get = require('get-value');
const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');

/**
 * @description Convert a value to a Number if it's a valid number, otherwise return it as-is.
 * @param {any} value - The value to convert.
 * @returns {number|any} The converted number or the original value.
 * @example parseNumber('42') // returns 42
 */
function parseNumber(value) {
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
}

/**
 * @description When a new MQTT message is received on a custom topic.
 * @param {string} topic - The topic where the message was published.
 * @param {string} message - The content of the message.
 * @param {string} deviceFeatureId - The device_feature_id.
 * @param {string} objectPath - The path where to look for, if the message is a JSON.
 * @example
 * handleDeviceCustomTopicMessage('custom_topic', '{"data": 12}', 'ea841937-74e5-401a-8b08-c546d9a322b5', 'data');
 */
function handleDeviceCustomTopicMessage(topic, message, deviceFeatureId, objectPath) {
  logger.debug(`New value on custom topic ${topic} for device_feature = ${deviceFeatureId}`);
  try {
    const deviceFeature = this.gladys.stateManager.get('deviceFeatureById', deviceFeatureId);
    if (!deviceFeature) {
      logger.warn(`handleDeviceCustomTopicMessage: Device feature ${deviceFeatureId} not found`);
      return;
    }
    // An empty or whitespace-only payload carries no state (a retained-clear publication),
    // and JSON.parse would only throw on it - ignore it before parsing
    if (message === undefined || message === null || String(message).trim() === '') {
      return;
    }
    // If objectPath is set the payload is JSON, otherwise it's a plain string
    const state = objectPath ? get(JSON.parse(message), objectPath) : message;
    // Number() turns '', ' ' and null into 0, and a missing path gives undefined:
    // none of those is a state, so ignore them instead
    if (state === undefined || state === null || String(state).trim() === '') {
      return;
    }
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: deviceFeature.external_id,
      state: parseNumber(state),
    });
  } catch (e) {
    logger.warn(
      `handleDeviceCustomTopicMessage: Fail to handle message from custom MQTT topic ${topic}, ${deviceFeatureId}, ${objectPath}`,
    );
    logger.warn(message);
    logger.warn(e);
  }
}

module.exports = { handleDeviceCustomTopicMessage };
