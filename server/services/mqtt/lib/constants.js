const CONFIGURATION = {
  MQTT_URL_KEY: 'MQTT_URL',
  MQTT_USERNAME_KEY: 'MQTT_USERNAME',
  MQTT_PASSWORD_KEY: 'MQTT_PASSWORD',
  MQTT_EMBEDDED_BROKER_KEY: 'MQTT_EMBEDDED_BROKER',
  MQTT_MOSQUITTO_VERSION: 'MQTT_MOSQUITTO',
  MQTT_CONTAINER_NAME: 'MQTT_CONTAINER_NAME', // Persisted name of the mosquitto broker container we own
  MQTT_BROKER_PORT: 'MQTT_BROKER_PORT', // Persisted host port of the embedded mosquitto broker
};

const DEFAULT = {
  TOPICS: [
    'gladys/master/#', // Default gladys topic
  ],
  INSTALLATION_STATUS: {
    DONE: 'DONE',
    IN_PROGRESS: 'IN_PROGRESS',
    ERROR: 'ERROR',
  },
  MOSQUITTO_VERSION: '4',
  PASSWORD_FILE_PATH: '/mosquitto/config/mosquitto.passwd',
  MOSQUITTO_DEFAULT_PORT: 1883, // Standard MQTT port, kept for every healthy/existing install
  RESERVED_PORTS: [1884], // Host ports hard-coded by other Gladys services (z2m broker) to avoid
  MAX_PORT_SEARCH_ATTEMPTS: 20, // Upper bound when scanning for a free port
};

module.exports = {
  CONFIGURATION,
  DEFAULT,
};
