const logger = require('../../utils/logger');
const { SUB_CONTAINER_DESIRED_VARIABLE } = require('./constants');

/**
 * @description Get the desired state of every declared sub-container:
 * what the supervisor must keep running. Defaults: `start: "auto"` entries
 * are desired running, `"manual"` entries are desired stopped until the
 * integration starts them through the API. The choice made through the API
 * is persisted so it survives Gladys restarts.
 * @param {object} service - The external integration service (plain object).
 * @returns {Promise<object>} Resolve with { "<name>": "running" | "stopped" }.
 * @example
 * const desired = await gladys.externalIntegration.getDesiredContainers(service);
 */
async function getDesiredContainers(service) {
  const rawDesired = await this.variable.getValue(SUB_CONTAINER_DESIRED_VARIABLE, service.id);
  let stored = {};
  if (rawDesired) {
    try {
      stored = JSON.parse(rawDesired);
    } catch (e) {
      logger.warn(`Invalid desired containers state of integration ${service.selector}`, e);
    }
  }
  const desired = {};
  this.getManifestContainers(service).forEach((entry) => {
    desired[entry.name] = stored[entry.name] || (entry.start === 'manual' ? 'stopped' : 'running');
  });
  return desired;
}

module.exports = {
  getDesiredContainers,
};
