const { v4: uuidv4 } = require('uuid');
const WebSocket = require('ws');

const { ExternalIntegrationUnavailableError } = require('../../utils/coreErrors');
const { formatWebsocketMessage } = require('../../utils/websocketUtils');
const { COMMAND_TIMEOUT_MS } = require('./constants');

/**
 * @description Send a command to an integration over WebSocket and wait for
 * its ack (command-result). Every command carries a message_id; no ack
 * within 5s means the command fails. A disconnected integration throws
 * immediately.
 * @param {object} service - The external integration service.
 * @param {string} type - The websocket message type of the command.
 * @param {object} payload - The payload of the command.
 * @returns {Promise<object>} Resolve with the command result payload.
 * @example
 * await gladys.externalIntegration.sendCommand(service, 'external-integration.device.set-value', { value: 1 });
 */
async function sendCommand(service, type, payload) {
  const ws = this.connections.get(service.id);
  if (!ws || ws.readyState !== WebSocket.OPEN) {
    throw new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_NOT_CONNECTED');
  }
  const messageId = uuidv4();
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      this.pendingCommands.delete(messageId);
      reject(new ExternalIntegrationUnavailableError('EXTERNAL_INTEGRATION_COMMAND_TIMEOUT'));
    }, COMMAND_TIMEOUT_MS);
    if (timer.unref) {
      timer.unref();
    }
    this.pendingCommands.set(messageId, { resolve, reject, timer });
    ws.send(formatWebsocketMessage(type, { message_id: messageId, ...payload }));
  });
}

module.exports = {
  sendCommand,
};
