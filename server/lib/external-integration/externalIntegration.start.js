const db = require('../../models');
const logger = require('../../utils/logger');
const { PlatformNotCompatible } = require('../../utils/coreErrors');
const { SERVICE_STATUS } = require('../../utils/constants');
const { STARTUP_TIMEOUT_MS } = require('./constants');

/**
 * @description Start an external integration: make sure the network and the
 * container exist, start the container (status LOADING) and arm the startup
 * timeout — a started container is not a working integration, RUNNING only
 * comes with the first successful WS auth or HTTP heartbeat; neither within
 * 60s means DEGRADED. Also called through the proxy service by the standard
 * service lifecycle (service.startAll at boot).
 * @param {string} selector - The selector of the external integration.
 * @param {object} [options] - Options.
 * @param {boolean} [options.resetFailureCount] - False for supervised
 * restarts, so the backoff keeps escalating.
 * @returns {Promise<object>} Resolve with the integration.
 * @example
 * await gladys.externalIntegration.start('ext-dev-my-integration');
 */
async function start(selector, { resetFailureCount = true } = {}) {
  const service = await this.getBySelector(selector);
  if (!this.available) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }
  this.clearTimers(service.id);
  // a manual start is the admin action required to leave the ERROR state
  if (resetFailureCount && service.failure_count > 0) {
    await db.Service.update({ failure_count: 0 }, { where: { id: service.id } });
  }
  await this.saveStatus(service, SERVICE_STATUS.LOADING);
  await this.ensureNetwork();
  // the desired sub-containers start before the main container (zero code
  // for the `start: "auto"` case; `"manual"` entries wait for the API)
  try {
    await this.ensureSubContainers(service);
  } catch (e) {
    logger.warn(`Unable to start sub-containers of integration ${selector}`, e);
  }
  let started = false;
  if (service.container_id) {
    try {
      await this.system.restartContainer(service.container_id);
      started = true;
    } catch (e) {
      logger.info(`Container of integration ${selector} not found or not startable, recreating it`, e);
    }
  }
  if (!started) {
    try {
      const container = await this.createIntegrationContainer(service);
      await this.system.restartContainer(container.id);
    } catch (e) {
      logger.warn(`Unable to start integration ${selector}`, e);
      await this.saveStatus(service, SERVICE_STATUS.ERROR);
      throw e;
    }
  }
  this.startedAt.set(service.id, Date.now());
  const startupTimer = setTimeout(() => {
    this.handleStartupTimeout(service);
  }, STARTUP_TIMEOUT_MS);
  // don't keep the process alive just for this timer
  if (startupTimer.unref) {
    startupTimer.unref();
  }
  this.startupTimers.set(service.id, startupTimer);
  return this.getBySelector(selector);
}

module.exports = {
  start,
};
