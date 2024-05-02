const get = require('get-value');
const logger = require('../../../utils/logger');
const { EVENTS } = require('../../../utils/constants');

/**
 * @description Listen to MQTT custom topic if needed.
 * @param {object} device - Device object.
 * @example listenToCustomMqttTopicIfNeeded(device);
 */
async function listenToCustomMqttTopicIfNeeded(device) {
  // Search if a custom topic param is here
  const deviceCustomTopicParam = device.params.find((p) => p.name.includes('mqtt_custom_topic_feature:'));
  if (!deviceCustomTopicParam) {
    return;
  }
  logger.debug(`Adding custom listener for device ${device.selector}`);
  const deviceCustomObjectPathParam = device.params.find((p) => p.name.includes('mqtt_custom_object_path_feature:'));
  const paramName = deviceCustomTopicParam.name;
  const deviceFeatureId = paramName.split(':')[1];
  const mqttTopic = deviceCustomTopicParam.value;
  const mqttCallback = (topic, message) => {
    let state = message;
    if (deviceCustomObjectPathParam) {
      const objectPath = deviceCustomObjectPathParam.value;
      try {
        state = get(JSON.parse(message), objectPath);
      } catch (e) {
        logger.warn(`Fail to parse message from custom MQTT topic.`);
        logger.warn(message);
        logger.warn(e);
      }
    }
    this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
      device_feature_external_id: this.gladys.stateManager.get('deviceFeatureById', deviceFeatureId).external_id,
      state,
    });
  };

  if (this.mqttClient) {
    logger.info(`Subscribing to MQTT topic ${mqttTopic}`);
    this.mqttClient.subscribe(mqttTopic);
  }
  // Save callback
  this.deviceFeatureCustomMqttTopics.push({
    topic: mqttTopic,
    regex_key: mqttTopic.replace('+', '[^/]+').replace('#', '.+'),
    device_feature_id: deviceFeatureId,
    callback: mqttCallback,
  });
}

module.exports = {
  listenToCustomMqttTopicIfNeeded,
};
