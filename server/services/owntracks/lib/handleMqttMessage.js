/* eslint dot-notation: [2, {"allowPattern": "(_[a-z]+)+$"}] */

const logger = require('../../../utils/logger');

/**
 * @description Handle a new message receive in MQTT.
 * @param {string} topic - MQTT topic.
 * @param {Object} message - The message sent.
 * @returns {undefined}
 * @example
 * handleMqttMessage('owntracks/location/deviceId', data);
 */
function handleMqttMessage(topic, message) {
  const splittedTopic = topic.split('/');
  const user = splittedTopic[2];

  if (topic.startsWith('owntracks')) {
    logger.debug(`MQTT : Gladys has a message for ${user} from Owntracks on ${topic} :${message}.`);
    const obj = JSON.parse(message);
    if(obj['_type'] === 'location') {

       // TODO : check is user exists or get user id using the selector
      ;(async () => {
         const users = await this.gladys.user.get({
         'selector': user,
         'take': 1,
         'skip': 0 });

         if (users) {
           const data = {
            'user_id'  : users[0].id,
            'latitude' : obj.lat,
            'longitude': obj.lon,
            'accuracy' : obj.acc,
            'altitude' : obj.alt,
          };
          await this.gladys.location.handleNewGatewayOwntracksLocation(data);
         }

       })();
   }
  }
}

module.exports = {
  handleMqttMessage,
};
