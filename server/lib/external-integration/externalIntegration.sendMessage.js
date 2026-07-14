const WebSocket = require('ws');

const logger = require('../../utils/logger');
const { formatWebsocketMessage } = require('../../utils/websocketUtils');

/**
 * @description Send a fire-and-forget message to an integration over
 * WebSocket (lifecycle notifications, scan request, config update...).
 * There is no queue: messages emitted while the integration is disconnected
 * are lost — the contract is that the integration resynchronizes
 * (GET /device + GET /config) at every (re)connection.
 * @param {object} service - The external integration service.
 * @param {string} type - The websocket message type.
 * @param {object} payload - The payload of the message.
 * @returns {boolean} True if the message was sent.
 * @example
 * gladys.externalIntegration.sendMessage(service, 'external-integration.scan-request', {});
 */
function sendMessage(service, type, payload) {
  const ws = this.connections.get(service.id);
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    logger.debug(`External integration ${service.selector} is not connected, message ${type} not sent`);
    return false;
  }
  ws.send(formatWebsocketMessage(type, payload));
  return true;
}

module.exports = {
  sendMessage,
};
