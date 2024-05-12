const logger = require('../../../utils/logger');

/**
 * @description Remove listener to custom mqtt topics.
 * @param {object} device - Device object.
 * @example unListenToCustomMqttTopic(device);
 */
async function unListenToCustomMqttTopic(device) {
  // Foreach feature in the device
  device.features.forEach((feature) => {
    // We look if there is a listener for this feature
    const deviceFeatureListener = this.deviceFeatureCustomMqttTopics.find((t) => t.device_feature_id === feature.id);
    // If not, we stop here
    if (!deviceFeatureListener) {
      return;
    }
    // If yes, we look if there are other listener listening to the same topic
    const remainingSimilarTopics = this.deviceFeatureCustomMqttTopics.filter(
      (t) => t.topic === deviceFeatureListener.topic,
    );
    // If no one listen this topic (except the one currently request), we unsuscribe from it
    if (remainingSimilarTopics.length <= 1 && !this.topicBinds[deviceFeatureListener.topic] && this.mqttClient) {
      logger.debug(`Unsubscribing from MQTT topic = ${deviceFeatureListener.topic}`);
      this.mqttClient.unsubscribe(deviceFeatureListener.topic);
    }
    // Remove topic from array
    this.deviceFeatureCustomMqttTopics = this.deviceFeatureCustomMqttTopics.filter(
      (t) => t.device_feature_id !== feature.id,
    );
  });
}

module.exports = {
  unListenToCustomMqttTopic,
};
