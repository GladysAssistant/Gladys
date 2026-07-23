const db = require('../../models');
const logger = require('../../utils/logger');
const { SERVICE_STATUS } = require('../../utils/constants');
const { WEBSOCKET_PING_INTERVAL_MS, MAX_MISSED_PINGS } = require('./constants');

/**
 * @description Register the WebSocket connection of an integration after a
 * successful authentication. A reconnection replaces the previous
 * connection. Starts the protocol ping (every 20s, any standard WS lib
 * answers with a pong automatically); 2 missed pongs -> DEGRADED. The first
 * successful auth is the LOADING -> RUNNING transition.
 * @param {object} service - The external integration service.
 * @param {object} ws - The WebSocket connection of the integration.
 * @returns {Promise} Resolve when done.
 * @example
 * await gladys.externalIntegration.integrationConnected(service, ws);
 */
async function integrationConnected(service, ws) {
  logger.info(`External integration ${service.selector} connected in websocket`);
  const existingConnection = this.connections.get(service.id);
  if (existingConnection && existingConnection !== ws) {
    try {
      existingConnection.terminate();
    } catch (e) {
      logger.debug(e);
    }
  }
  // a re-authentication on the same socket must not stack ping loops
  if (ws.integrationPingInterval) {
    clearInterval(ws.integrationPingInterval);
  }
  this.connections.set(service.id, ws);
  let missedPings = 0;
  ws.isAliveIntegration = true;
  ws.on('pong', () => {
    ws.isAliveIntegration = true;
  });
  const pingInterval = setInterval(async () => {
    if (this.connections.get(service.id) !== ws) {
      clearInterval(pingInterval);
      return;
    }
    if (ws.isAliveIntegration === false) {
      missedPings += 1;
    } else {
      missedPings = 0;
    }
    if (missedPings >= MAX_MISSED_PINGS) {
      clearInterval(pingInterval);
      try {
        ws.terminate();
      } catch (e) {
        logger.debug(e);
      }
      await this.saveStatus(service, SERVICE_STATUS.DEGRADED);
      return;
    }
    ws.isAliveIntegration = false;
    try {
      ws.ping();
    } catch (e) {
      logger.debug(e);
    }
  }, WEBSOCKET_PING_INTERVAL_MS);
  if (pingInterval.unref) {
    pingInterval.unref();
  }
  ws.integrationPingInterval = pingInterval;
  await db.Service.update({ last_heartbeat: new Date() }, { where: { id: service.id } });
  await this.setRunning(service);
}

module.exports = {
  integrationConnected,
};
