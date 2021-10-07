/* eslint dot-notation: [2, {"allowPattern": "(_[a-z]+)+$"}] */

const logger = require('../../../utils/logger');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {Object} message - The message sent.
 * @returns {undefined}
 * @example
 * handleMqttMessage('owntracks/location/user_selector', data);
 */
async function handleMqttMessage(topic, message) {
  const splittedTopic = topic.split('/');
  const userSelector = splittedTopic[2];

  if (topic.startsWith('owntracks')) {
    logger.debug(`MQTT : Gladys has a message for ${userSelector} from Owntracks on ${topic} :${message}.`);
    const obj = JSON.parse(message);
    if (obj['_type'] === 'location') {
      const user = await this.gladys.user.getBySelector(userSelector);
      const data = {
        latitude: obj.lat,
        longitude: obj.lon,
        accuracy: obj.acc,
        altitude: obj.alt,
      };
      this.gladys.location.handleNewOwntracksLocation(user, data);
    }
  }
}

module.exports = {
  handleMqttMessage,
};
