const logger = require('../../../utils/logger');
const { MQTT_CONNECTION_ERROR } = require('./constants');
const { formatDuration } = require('../utils/formatDuration');
const { getMqttConnectionError } = require('../utils/getMqttConnectionError');

// Mosquitto listens within a second on a fast machine: tried often, so that the installation goes on at once
const RETRY_INTERVAL_IN_MS = 250;
// A listening broker answers at once: an attempt that lasts is a connection that will not be answered
const ATTEMPT_TIMEOUT_IN_MS = 2000;
// Beyond, Gladys goes on without the answer, as it did before: its client reconnects every 5 seconds (see connect)
const MAX_WAIT_IN_MS = 30 * 1000;

/**
 * @description Try once to connect to the MQTT broker.
 * @param {object} mqttLibrary - MQTT lib.
 * @param {object} config - Service configuration properties.
 * @param {string} config.mqttUrl - MQTT URL.
 * @param {string} config.mqttUsername - MQTT username of Gladys.
 * @param {string} config.mqttPassword - MQTT password of Gladys.
 * @returns {Promise} Resolve with null once the broker answered, or with the error of a broker that did not.
 * @example
 * const error = await probeBroker(this.mqttLibrary, config);
 */
function probeBroker(mqttLibrary, { mqttUrl, mqttUsername, mqttPassword }) {
  return new Promise((resolve) => {
    const client = mqttLibrary.connect(mqttUrl, {
      username: mqttUsername,
      password: mqttPassword,
      // One attempt only: the next one is decided here
      reconnectPeriod: 0,
      connectTimeout: ATTEMPT_TIMEOUT_IN_MS,
      // Not the client id of Gladys, as the broker disconnects a client when another one connects with its id
      clientId: `gladys-broker-probe-${Math.floor(Math.random() * 1000000)}`,
    });
    // Only these listeners are removed: the client keeps its own, which clear its timers once the connection is closed
    const listeners = {};
    const settle = (error) => {
      Object.entries(listeners).forEach(([event, listener]) => client.removeListener(event, listener));
      client.end(true);
      resolve(error);
    };
    listeners.connect = () => settle(null);
    listeners.error = (error) => {
      const { code } = getMqttConnectionError(error);
      // Refusing the credentials is an answer: the broker runs, and connect tells the user about the credentials
      const authenticationFailed =
        code === MQTT_CONNECTION_ERROR.BAD_CREDENTIALS || code === MQTT_CONNECTION_ERROR.NOT_AUTHORIZED;
      settle(authenticationFailed ? null : error);
    };
    // Without an error before: the MQTT client does not forward every socket error, and closes the connection when
    // the broker does not answer within the connect timeout
    listeners.close = () => settle(new Error('Connection closed without an answer'));
    Object.entries(listeners).forEach(([event, listener]) => client.on(event, listener));
  });
}

/**
 * @description Wait for the MQTT broker of Gladys to answer once its container is started.
 * @param {object} config - Service configuration properties.
 * @returns {Promise} Resolve once the broker answers, even to refuse the credentials, or after the maximum wait.
 * @example
 * await this.waitForBroker(config);
 */
async function waitForBroker(config) {
  const startedAt = Date.now();
  let error = await probeBroker(this.mqttLibrary, config);
  while (error && Date.now() - startedAt < MAX_WAIT_IN_MS) {
    // eslint-disable-next-line no-await-in-loop
    await new Promise((resolve) => {
      setTimeout(resolve, RETRY_INTERVAL_IN_MS);
    });
    // eslint-disable-next-line no-await-in-loop
    error = await probeBroker(this.mqttLibrary, config);
  }
  if (error) {
    // A refused connection to localhost has no message since Node 20, which tries both its IPv4 and IPv6 addresses
    const reason = error.message || error.code;
    // Not a failure: a slow machine may need more time, and the client of Gladys connects once the broker answers
    logger.warn(`MQTT broker did not answer within ${formatDuration(MAX_WAIT_IN_MS)}, going on anyway: ${reason}`);
    return;
  }
  logger.info(`MQTT broker ready in ${formatDuration(Date.now() - startedAt)}`);
}

module.exports = {
  waitForBroker,
};
