const Promise = require('bluebird');
const get = require('get-value');

const logger = require('../../utils/logger');

/**
 * @description Health check of the sub-containers of one integration: a
 * container "supposed to run" (desired state, see getDesiredContainers)
 * that exited — or disappeared — is restarted with the same backoff and the
 * same failure_count as the main container; a container stopped through the
 * API stays stopped.
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise} Resolve when the check is done.
 * @example
 * await gladys.externalIntegration.checkSubContainersHealth(service);
 */
async function checkSubContainersHealth(service) {
  const entries = this.getManifestContainers(service);
  if (entries.length === 0) {
    return;
  }
  const desired = await this.getDesiredContainers(service);
  await Promise.each(
    entries.filter((entry) => desired[entry.name] === 'running'),
    async (entry) => {
      if (this.restartTimers.has(`${service.id}:${entry.name}`)) {
        // a restart is already scheduled with backoff
        return;
      }
      const container = await this.findSubContainer(service, entry.name);
      let running = false;
      if (container) {
        try {
          const containerInspect = await this.system.inspectContainer(container.id);
          running = get(containerInspect, 'State.Running') === true;
        } catch (e) {
          // a transient inspection failure is not a crashed container
          logger.debug(`Unable to inspect sub-container ${entry.name} of integration ${service.selector}`, e);
          return;
        }
      }
      if (!running) {
        await this.scheduleSubContainerRestart(service, entry);
      }
    },
  );
}

module.exports = {
  checkSubContainersHealth,
};
