const db = require('../../models');
const logger = require('../../utils/logger');
const { SERVICE_STATUS } = require('../../utils/constants');

/**
 * @description Called 60s after a container start: if the integration has
 * still not authenticated on the WebSocket nor sent an HTTP heartbeat, it is
 * not working — mark it DEGRADED.
 * @param {object} service - The external integration service.
 * @returns {Promise} Resolve when done.
 * @example
 * await gladys.externalIntegration.handleStartupTimeout(service);
 */
async function handleStartupTimeout(service) {
  this.startupTimers.delete(service.id);
  try {
    const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
    if (serviceInDb === null) {
      return;
    }
    if (serviceInDb.status === SERVICE_STATUS.LOADING || serviceInDb.status === SERVICE_STATUS.RUNNING) {
      const connected = this.connections.has(service.id);
      const heartbeatSince =
        serviceInDb.last_heartbeat && serviceInDb.last_heartbeat.getTime() >= this.startedAt.get(service.id);
      if (!connected && !heartbeatSince) {
        await this.saveStatus(service, SERVICE_STATUS.DEGRADED);
      }
    }
  } catch (e) {
    logger.warn(`Unable to handle startup timeout of integration ${service.selector}`, e);
  }
}

module.exports = {
  handleStartupTimeout,
};
