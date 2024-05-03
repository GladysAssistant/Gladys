const logger = require('../../../utils/logger');

/**
 * @description Listen to MQTT custom topic if needed.
 * @param {object} device - Device object.
 * @example listenToCustomMqttTopicIfNeeded(device);
 */
async function listenToCustomMqttTopicIfNeeded(device) {
  // Search if a custom topic param is here
  const deviceCustomTopicParams = device.params.filter((p) => p.name.includes('mqtt_custom_topic_feature:'));
  deviceCustomTopicParams.forEach((deviceCustomTopicParam) => {
    const paramName = deviceCustomTopicParam.name;
    const deviceFeatureId = paramName.split(':')[1];
    logger.debug(`Adding custom listener for device ${device.selector}, feature = ${deviceFeatureId}`);
    const deviceCustomObjectPathParam = device.params.find((p) =>
      p.name.includes(`mqtt_custom_object_path_feature:${deviceFeatureId}`),
    );
    let objectPath = null;
    if (deviceCustomObjectPathParam) {
      objectPath = deviceCustomObjectPathParam.value;
    }
    const mqttTopic = deviceCustomTopicParam.value;
    // Add listener to list of custom listeners
    this.deviceFeatureCustomMqttTopics.push({
      topic: mqttTopic,
      regex_key: mqttTopic.replace('+', '[^/]+').replace('#', '.+'),
      device_feature_id: deviceFeatureId,
      object_path: objectPath,
    });
    // Listen to MQTT topic
    if (this.mqttClient) {
      logger.info(`Subscribing to MQTT topic ${mqttTopic}`);
      this.mqttClient.subscribe(mqttTopic);
    }
  });
}

module.exports = {
  listenToCustomMqttTopicIfNeeded,
};
