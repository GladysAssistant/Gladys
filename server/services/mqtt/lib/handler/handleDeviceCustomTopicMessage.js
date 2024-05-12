const get = require('get-value');
const logger = require('../../../../utils/logger');
const { EVENTS } = require('../../../../utils/constants');

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
  // If objectPath is not null, it's supposed to be a JSON
  if (objectPath) {
    try {
      const state = get(JSON.parse(message), objectPath);
      this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
        device_feature_external_id: this.gladys.stateManager.get('deviceFeatureById', deviceFeatureId).external_id,
        state,
      });
    } catch (e) {
      logger.warn(`Fail to parse message from custom MQTT topic.`);
      logger.warn(message);
      logger.warn(e);
    }
  } else {
    // else, it's supposed to be a normal string, send it raw
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: this.gladys.stateManager.get('deviceFeatureById', deviceFeatureId).external_id,
      state: message,
    });
  }
}

module.exports = { handleDeviceCustomTopicMessage };
