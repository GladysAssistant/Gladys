const db = require('../../models');
const logger = require('../../utils/logger');
const { SERVICE_STATUS } = require('../../utils/constants');
const { MAX_FAILURE_COUNT, RESTART_BACKOFF_BASE_MS, RESTART_BACKOFF_MAX_MS } = require('./constants');

/**
 * @description Schedule the supervised restart of a crashed sub-container:
 * same backoff and same failure_count as the main container (the state
 * machine stays driven by the main container, so the integration status is
 * not touched below the ERROR threshold). failure_count >= 5 -> ERROR and
 * everything is stopped, admin action required.
 * @param {object} service - The external integration service (plain object).
 * @param {object} entry - The sub-container declaration from the manifest.
 * @returns {Promise} Resolve when the restart is scheduled.
 * @example
 * await gladys.externalIntegration.scheduleSubContainerRestart(service, entry);
 */
async function scheduleSubContainerRestart(service, entry) {
  // atomic increment: concurrent crash signals must not clobber each other
  await db.Service.update({ failure_count: db.sequelize.literal('failure_count + 1') }, { where: { id: service.id } });
  const updatedService = await db.Service.findOne({ where: { id: service.id }, attributes: ['failure_count'] });
  const failureCount = updatedService.failure_count;
  if (failureCount >= MAX_FAILURE_COUNT) {
    logger.warn(
      `Sub-container ${entry.name} of integration ${service.selector} crashed ${failureCount} times, giving up`,
    );
    await this.saveStatus(service, SERVICE_STATUS.ERROR);
    // everything is stopped: main container first, then the sub-containers
    if (service.container_id) {
      try {
        await this.system.stopContainer(service.container_id);
      } catch (e) {
        logger.debug(e);
      }
    }
    await this.stopSubContainers(service);
    return;
  }
  const delay = Math.min(RESTART_BACKOFF_BASE_MS * 2 ** (failureCount - 1), RESTART_BACKOFF_MAX_MS);
  logger.info(
    `Sub-container ${entry.name} of integration ${service.selector}: restart scheduled in ${delay / 1000}s`,
  );
  const timerKey = `${service.id}:${entry.name}`;
  if (this.restartTimers.has(timerKey)) {
    clearTimeout(this.restartTimers.get(timerKey));
  }
  const restartTimer = setTimeout(() => {
    this.restartTimers.delete(timerKey);
    this.startSubContainer(service, entry).catch((e) => {
      logger.warn(`Unable to restart sub-container ${entry.name} of integration ${service.selector}`, e);
    });
  }, delay);
  if (restartTimer.unref) {
    restartTimer.unref();
  }
  this.restartTimers.set(timerKey, restartTimer);
}

module.exports = {
  scheduleSubContainerRestart,
};
