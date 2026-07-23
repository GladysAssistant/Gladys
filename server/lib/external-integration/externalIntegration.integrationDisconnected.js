const db = require('../../models');
const logger = require('../../utils/logger');
const { SERVICE_STATUS } = require('../../utils/constants');

/**
 * @description Handle the disconnection of an integration WebSocket. A
 * RUNNING integration whose socket closes becomes DEGRADED (recovers on
 * reconnection or heartbeat).
 * @param {object} service - The external integration service.
 * @param {object} ws - The WebSocket connection that closed.
 * @returns {Promise} Resolve when done.
 * @example
 * await gladys.externalIntegration.integrationDisconnected(service, ws);
 */
async function integrationDisconnected(service, ws) {
  logger.info(`External integration ${service.selector} disconnected from websocket`);
  if (ws.integrationPingInterval) {
    clearInterval(ws.integrationPingInterval);
  }
  if (this.connections.get(service.id) !== ws) {
    // an old connection replaced by a reconnection: nothing to do
    return;
  }
  this.connections.delete(service.id);
  const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
  if (serviceInDb !== null && serviceInDb.status === SERVICE_STATUS.RUNNING) {
    await this.saveStatus(service, SERVICE_STATUS.DEGRADED);
  }
}

module.exports = {
  integrationDisconnected,
};
