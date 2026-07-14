const db = require('../../models');
const logger = require('../../utils/logger');
const { SERVICE_STATUS } = require('../../utils/constants');
const { STABLE_RUNNING_RESET_MS } = require('./constants');

/**
 * @description Transition an integration to RUNNING (first successful WS
 * auth or heartbeat, or recovery from DEGRADED). Clears the supervision
 * timers and arms the stable-running timer: failure_count is reset to zero
 * after 60s of stable RUNNING (without this reset, 5 crashes spread over six
 * months would put the integration in ERROR).
 * @param {object} service - The external integration service.
 * @returns {Promise} Resolve when done.
 * @example
 * await gladys.externalIntegration.setRunning(service);
 */
async function setRunning(service) {
  this.clearTimers(service.id);
  await this.saveStatus(service, SERVICE_STATUS.RUNNING);
  const stableTimer = setTimeout(async () => {
    this.stableRunningTimers.delete(service.id);
    try {
      await db.Service.update({ failure_count: 0 }, { where: { id: service.id } });
    } catch (e) {
      logger.warn(`Unable to reset failure count of integration ${service.selector}`, e);
    }
  }, STABLE_RUNNING_RESET_MS);
  if (stableTimer.unref) {
    stableTimer.unref();
  }
  this.stableRunningTimers.set(service.id, stableTimer);
}

module.exports = {
  setRunning,
};
