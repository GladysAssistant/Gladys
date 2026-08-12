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
    let containerInspect;
    try {
      containerInspect = await this.system.inspectContainer(service.container_id);
    } catch (e) {
      // a transient inspection failure is not a crashed container:
      // skip and let the next health-check cycle retry
      logger.debug(`Unable to inspect container of integration ${service.selector}`, e);
      return;
    }
    if (get(containerInspect, 'State.Running') !== true) {
      await this.scheduleRestart(service);
      return;
    }
    // sub-containers "supposed to run" that exited are restarted with the
    // same backoff and the same failure_count as the main container
    await this.checkSubContainersHealth(service);
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
