const db = require('../../models');
const { SERVICE_STATUS } = require('../../utils/constants');

/**
 * @description Handle a heartbeat of an integration (HTTP fallback or WS
 * applicative message): update last_heartbeat, and transition
 * LOADING/DEGRADED -> RUNNING (a heartbeat is a proof of life).
 * @param {object} service - The external integration service.
 * @returns {Promise} Resolve when done.
 * @example
 * await gladys.externalIntegration.handleHeartbeat(service);
 */
async function handleHeartbeat(service) {
  await db.Service.update({ last_heartbeat: new Date() }, { where: { id: service.id } });
  const serviceInDb = await db.Service.findOne({ where: { id: service.id } });
  if (
    serviceInDb !== null &&
    (serviceInDb.status === SERVICE_STATUS.LOADING || serviceInDb.status === SERVICE_STATUS.DEGRADED)
  ) {
    await this.setRunning(service);
  }
}

module.exports = {
  handleHeartbeat,
};
