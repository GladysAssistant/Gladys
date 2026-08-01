const db = require('../../models');
const logger = require('../../utils/logger');
const { SERVICE_STATUS } = require('../../utils/constants');
const { MAX_FAILURE_COUNT, RESTART_BACKOFF_BASE_MS, RESTART_BACKOFF_MAX_MS } = require('./constants');

/**
 * @description Schedule a supervised restart of a crashed integration, with
 * backoff min(10s * 2^n, 15min). failure_count is incremented at every
 * supervisor restart (and reset after 60s of stable RUNNING, see
 * setRunning); failure_count >= 5 -> ERROR, no more auto restart, admin
 * action required.
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise} Resolve when the restart is scheduled.
 * @example
 * await gladys.externalIntegration.scheduleRestart(service);
 */
async function scheduleRestart(service) {
  // atomic increment: concurrent crash signals must not clobber each other
  await db.Service.update({ failure_count: db.sequelize.literal('failure_count + 1') }, { where: { id: service.id } });
  const updatedService = await db.Service.findOne({ where: { id: service.id }, attributes: ['failure_count'] });
  const failureCount = updatedService.failure_count;
  if (failureCount >= MAX_FAILURE_COUNT) {
    logger.warn(`External integration ${service.selector} crashed ${failureCount} times, giving up`);
    await this.saveStatus(service, SERVICE_STATUS.ERROR);
    return;
  }
  await this.saveStatus(service, SERVICE_STATUS.DEGRADED);
  const delay = Math.min(RESTART_BACKOFF_BASE_MS * 2 ** (failureCount - 1), RESTART_BACKOFF_MAX_MS);
  logger.info(`External integration ${service.selector}: restart scheduled in ${delay / 1000}s`);
  // cancel a possibly pending restart before scheduling its replacement
  if (this.restartTimers.has(service.id)) {
    clearTimeout(this.restartTimers.get(service.id));
  }
  const restartTimer = setTimeout(() => {
    this.restartTimers.delete(service.id);
    this.start(service.selector, { resetFailureCount: false }).catch((e) => {
      logger.warn(`Unable to restart integration ${service.selector}`, e);
    });
  }, delay);
  if (restartTimer.unref) {
    restartTimer.unref();
  }
  this.restartTimers.set(service.id, restartTimer);
}

module.exports = {
  scheduleRestart,
};
