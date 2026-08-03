const { BadParameters } = require('../../utils/coreErrors');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description Store the application-level connection status published by an
 * integration (POST /connection_status of the host API): "connected to
 * Netatmo", "token expired, please reconnect"... Kept in memory only (lost
 * at restart, republished by the integration), exposed in the admin detail
 * and pushed to the frontend in real time. Distinct from the container state
 * machine: a cloud integration can be RUNNING (healthy container, WS
 * connected) and yet disconnected from its third-party service.
 * @param {object} service - The external integration service.
 * @param {object} status - The connection status.
 * @param {boolean} status.connected - Connected to the third-party service.
 * @param {object} [status.message] - Optional multi-language message ({ en, fr... }, en required).
 * @returns {object} The stored connection status.
 * @example
 * gladys.externalIntegration.setConnectionStatus(service, { connected: false, message: { en: 'Token expired' } });
 */
function setConnectionStatus(service, { connected, message } = {}) {
  if (typeof connected !== 'boolean') {
    throw new BadParameters('connected: must be a boolean');
  }
  if (message !== undefined && message !== null) {
    if (typeof message !== 'object' || Array.isArray(message)) {
      throw new BadParameters('message: must be an object mapping language codes to strings');
    }
    if (typeof message.en !== 'string') {
      throw new BadParameters('message.en: english translation is required');
    }
    const invalidLanguage = Object.keys(message).find((language) => typeof message[language] !== 'string');
    if (invalidLanguage) {
      throw new BadParameters(`message.${invalidLanguage}: must be a string`);
    }
  }
  const connectionStatus = { connected, message: message || null };
  this.connectionStatuses.set(service.id, connectionStatus);
  this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.EXTERNAL_INTEGRATION.CONNECTION_STATUS_UPDATED,
    payload: {
      selector: service.selector,
      ...connectionStatus,
    },
  });
  return connectionStatus;
}

module.exports = {
  setConnectionStatus,
};
