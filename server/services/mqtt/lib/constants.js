const CONFIGURATION = {
  MQTT_URL_KEY: 'MQTT_URL',
  MQTT_USERNAME_KEY: 'MQTT_USERNAME',
  MQTT_PASSWORD_KEY: 'MQTT_PASSWORD',
};

const DEFAULT = {
  TOPICS: [
    'gladys/master/#', // Default gladys topic
  ],
};

module.exports = {
  CONFIGURATION,
  DEFAULT,
};
