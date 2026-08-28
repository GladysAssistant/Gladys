const { MQTT_CONNECTION_ERROR } = require('../lib/constants');

// CONNACK return codes rejecting the credentials: 4 & 5 in MQTT 3.1.1
// ("Bad username or password", "Not authorized"), 134 & 135 in MQTT 5
const AUTHENTICATION_RETURN_CODES = [4, 5, 134, 135];
// Network level failures raised before the broker even answers
const UNREACHABLE_ERROR_CODES = ['ECONNREFUSED', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'EHOSTUNREACH'];

/**
 * @description Convert an error emitted by the MQTT client into an explicit error for the UI.
 * @param {object} error - Error emitted by the MQTT client.
 * @returns {object} Object with a known `code`, or a `null` code and the raw `message`.
 * @example
 * const mqttConnectionError = getMqttConnectionError(new Error('Connection refused: Not authorized'));
 */
function getMqttConnectionError(error = {}) {
  const { code, message } = error;

  if (AUTHENTICATION_RETURN_CODES.includes(code)) {
    return { code: MQTT_CONNECTION_ERROR.BAD_CREDENTIALS, message: null };
  }

  if (UNREACHABLE_ERROR_CODES.includes(code)) {
    return { code: MQTT_CONNECTION_ERROR.BROKER_UNREACHABLE, message: null };
  }

  return { code: null, message: message || null };
}

module.exports = {
  getMqttConnectionError,
};
