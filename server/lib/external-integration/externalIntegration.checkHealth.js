const Promise = require('bluebird');
const get = require('get-value');

const db = require('../../models');
const logger = require('../../utils/logger');
const { SERVICE_STATUS, SERVICE_TYPES } = require('../../utils/constants');
const { HEARTBEAT_TIMEOUT_MS } = require('./constants');

const SUPERVISED_STATUSES = [SERVICE_STATUS.LOADING, SERVICE_STATUS.RUNNING, SERVICE_STATUS.DEGRADED];

/**
 * @description Health check of every external integration, every 30s:
 * an exited container is restarted with backoff (failure_count driven), a
 * RUNNING integration without WS connection nor heartbeat for more than 60s
 * becomes DEGRADED.
 * @returns {Promise} Resolve when the check is done.
 * @example
 * await gladys.externalIntegration.checkHealth();
 */
async function checkHealth() {
  if (!this.available) {
    return;
  }
  const services = await db.Service.findAll({
    where: {
      type: SERVICE_TYPES.EXTERNAL,
      pod_id: null,
    },
  });
  await Promise.each(services, async (serviceInDb) => {
    const service = serviceInDb.get({ plain: true });
    if (!SUPERVISED_STATUSES.includes(service.status)) {
      return;
    }
    if (this.restartTimers.has(service.id)) {
      // a restart is already scheduled with backoff
      return;
    }
    if (!service.container_id) {
      return;
    }
    let containerRunning = false;
    try {
      const containerInspect = await this.system.inspectContainer(service.container_id);
      containerRunning = get(containerInspect, 'State.Running') === true;
    } catch (e) {
      logger.debug(`Unable to inspect container of integration ${service.selector}`, e);
    }
    if (!containerRunning) {
      await this.scheduleRestart(service);
      return;
    }
    // container alive but silent integration: DEGRADED
    if (service.status === SERVICE_STATUS.RUNNING && !this.connections.has(service.id)) {
      const lastHeartbeat = service.last_heartbeat ? new Date(service.last_heartbeat).getTime() : 0;
      if (Date.now() - lastHeartbeat > HEARTBEAT_TIMEOUT_MS) {
        await this.saveStatus(service, SERVICE_STATUS.DEGRADED);
      }
    }
  });
}

module.exports = {
  checkHealth,
};
