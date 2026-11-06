const db = require('../../models');
const logger = require('../../utils/logger');
const { isCpuCfsError } = require('../system/system.createContainer');
const { PlatformNotCompatible } = require('../../utils/coreErrors');
const { SERVICE_STATUS } = require('../../utils/constants');
const { STARTUP_TIMEOUT_MS } = require('./constants');

/**
 * @description Start an external integration: make sure the network and the
 * container exist, start the container (status LOADING) and arm the startup
 * timeout — a started container is not a working integration, RUNNING only
 * comes with the first successful WS auth or HTTP heartbeat; neither within
 * 60s means DEGRADED. An image missing on the machine (backup restored on
 * a new machine) is pulled first, in the background: the start returns the
 * LOADING integration and pullMissingImages starts it again once every
 * image is there. Also called through the proxy service by the standard
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
  if (this.imagePulls.has(service.id)) {
    // the images of a previous start are still being pulled: that pull
    // ends with a start, nothing to do until then
    return service;
  }
  this.clearTimers(service.id);
  // a manual start is the admin action required to leave the ERROR state
  if (resetFailureCount && service.failure_count > 0) {
    await db.Service.update({ failure_count: 0 }, { where: { id: service.id } });
  }
  await this.saveStatus(service, SERVICE_STATUS.LOADING);
  await this.ensureNetwork();
  // the row can outlive the images: a backup restored on another machine
  // (migration to a new mini-PC) brings the integration back without its
  // containers nor its images — pull what is missing in the background
  // (service.startAll is sequential: an awaited pull would hold every
  // later service back) and come back here once done
  const missingImages = await this.getMissingImages(service);
  if (missingImages.length > 0) {
    this.pullMissingImages(service, missingImages).catch((e) => {
      logger.warn(`Unable to pull the images of integration ${selector}`, e);
    });
    return this.getBySelector(selector);
  }
  // the desired sub-containers start before the main container (zero code
  // for the `start: "auto"` case; `"manual"` entries wait for the API)
  try {
    await this.ensureSubContainers(service);
  } catch (e) {
    logger.warn(`Unable to start sub-containers of integration ${selector}`, e);
  }
  let started = false;
  if (service.container_id) {
    // the container keeps the integration JWT it was created with: with a
    // stale token (JWT secret regenerated before it was persisted, token
    // rotation) a restart can only loop on "authentication refused
    // (close code 4000)" — recreate the container with a fresh token instead
    const containerTokenValid = await this.verifyContainerToken(service);
    if (containerTokenValid) {
      try {
        await this.system.restartContainer(service.container_id);
        started = true;
      } catch (e) {
        // the kernel cannot apply the stored CPU limit (cgroup v2 without
        // CFS bandwidth control fails only here, at start): remember it so
        // the recreation below builds a descriptor without NanoCpus
        if (isCpuCfsError(e)) {
          logger.warn(`Integration ${selector}: kernel without CPU CFS support, recreating without CPU limit`);
          this.system.cpuCfsSupport = false;
        }
        logger.info(`Container of integration ${selector} not found or not startable, recreating it`, e);
      }
    } else {
      logger.info(`Container of integration ${selector} holds a stale integration token, recreating it`);
    }
  }
  if (!started) {
    try {
      try {
        const container = await this.createIntegrationContainer(service);
        await this.system.restartContainer(container.id);
      } catch (e) {
        // fresh container whose CPU limit passed the creation but is
        // rejected at start (cgroup v2 kernel without CFS bandwidth
        // control): recreate it once without the limit
        if (!isCpuCfsError(e) || this.system.cpuCfsSupport === false) {
          throw e;
        }
        logger.warn(`Integration ${selector}: kernel without CPU CFS support, recreating without CPU limit`);
        this.system.cpuCfsSupport = false;
        const updatedService = await this.getBySelector(selector);
        const container = await this.createIntegrationContainer(updatedService);
        await this.system.restartContainer(container.id);
      }
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
