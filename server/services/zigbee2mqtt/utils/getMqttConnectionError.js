const { MQTT_CONNECTION_ERROR } = require('../lib/constants');

// CONNACK return codes rejecting the credentials themselves: 4 in MQTT 3.1.1
// ("Bad user name or password"), 134 in MQTT 5.
const BAD_CREDENTIALS_RETURN_CODES = [4, 134];
// CONNACK return codes refusing the client without blaming the credentials: 5 in MQTT 3.1.1
// ("Not authorized"), 135 in MQTT 5. Brokers use them both for a failed login (Mosquitto) and
// for an ACL denying an otherwise valid user, so the message must cover the two cases.
const NOT_AUTHORIZED_RETURN_CODES = [5, 135];
// Network level failures raised before the broker even answers.
// mqtt@4.2 only forwards the socket errors of its own allow list (ECONNREFUSED, EADDRINUSE,
// ECONNRESET, ENOTFOUND), while mqtt@4.3 forwards every socket error carrying a `code`, hence
// the DNS and timeout codes below.
const UNREACHABLE_ERROR_CODES = ['ECONNREFUSED', 'ECONNRESET', 'ENOTFOUND', 'EAI_AGAIN', 'ETIMEDOUT', 'EHOSTUNREACH'];

/**
 * @description Convert an error emitted by the MQTT client into an explicit error for the UI.
 * @param {object} error - Error emitted by the MQTT client.
 * @returns {object} Object with a known `code`, or a `null` code and the raw `message`.
 * @example
 * const mqttConnectionError = getMqttConnectionError(new Error('Connection refused: Not authorized'));
 */
function getMqttConnectionError(error = {}) {
  const { code, message } = error;

  if (BAD_CREDENTIALS_RETURN_CODES.includes(code)) {
    return { code: MQTT_CONNECTION_ERROR.BAD_CREDENTIALS, message: null };
  }

  if (NOT_AUTHORIZED_RETURN_CODES.includes(code)) {
    return { code: MQTT_CONNECTION_ERROR.NOT_AUTHORIZED, message: null };
  }

  if (UNREACHABLE_ERROR_CODES.includes(code)) {
    return { code: MQTT_CONNECTION_ERROR.BROKER_UNREACHABLE, message: null };
  }

  return { code: null, message: message || null };
}

module.exports = {
  getMqttConnectionError,
};
