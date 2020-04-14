const CONFIGURATION = {
  MQTT_URL_KEY: 'MQTT_URL',
  MQTT_USERNAME_KEY: 'MQTT_USERNAME',
  MQTT_PASSWORD_KEY: 'MQTT_PASSWORD',
  MQTT_EMBEDDED_BROKER_KEY: 'MQTT_EMBEDDED_BROKER',
};

const DEFAULT = {
  TOPICS: [
    'gladys/master/#', // Default gladys topic
  ],
  HIDDEN_PASSWORD: '*********',
};

module.exports = {
  CONFIGURATION,
  DEFAULT,
};
