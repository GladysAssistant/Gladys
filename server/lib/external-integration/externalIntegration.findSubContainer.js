const { EXTERNAL_INTEGRATION_LABEL, SUB_CONTAINER_LABEL } = require('./constants');

/**
 * @description Find the Docker container of a declared sub-container, by
 * labels (reconciliation key + sub-container name).
 * @param {object} service - The external integration service (plain object).
 * @param {string} name - The sub-container name.
 * @returns {Promise<object|null>} Resolve with the container summary, or null.
 * @example
 * const container = await gladys.externalIntegration.findSubContainer(service, 'mqtt');
 */
async function findSubContainer(service, name) {
  const containers = await this.system.getContainers({
    all: true,
    filters: {
      label: [`${EXTERNAL_INTEGRATION_LABEL}=${service.selector}`, `${SUB_CONTAINER_LABEL}=${name}`],
    },
  });
  return containers[0] || null;
}

module.exports = {
  findSubContainer,
};
