const logger = require('../../utils/logger');
const { SUB_CONTAINER_DESIRED_VARIABLE } = require('./constants');

/**
 * @description Persist the desired state of one sub-container (started or
 * stopped through the /container API). A container stopped by the
 * integration stays stopped: the supervisor will not restart it.
 * @param {object} service - The external integration service (plain object).
 * @param {string} name - The sub-container name.
 * @param {string} desired - 'running' or 'stopped'.
 * @returns {Promise} Resolve when persisted.
 * @example
 * await gladys.externalIntegration.setDesiredContainer(service, 'mqtt', 'running');
 */
async function setDesiredContainer(service, name, desired) {
  const rawDesired = await this.variable.getValue(SUB_CONTAINER_DESIRED_VARIABLE, service.id);
  let stored = {};
  if (rawDesired) {
    try {
      stored = JSON.parse(rawDesired);
    } catch (e) {
      logger.warn(`Invalid desired containers state of integration ${service.selector}`, e);
    }
  }
  stored[name] = desired;
  await this.variable.setValue(SUB_CONTAINER_DESIRED_VARIABLE, JSON.stringify(stored), service.id);
}

module.exports = {
  setDesiredContainer,
};
