const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Start container.
 * @returns {Promise} Container object.
 * @param {string} containerName - Container name.
 * @example
 * const container = await startContainer('mqtt');
 */
async function startContainer(containerName) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const container = await this.dockerode.getContainer(containerName).start();

  logger.info(`container ${containerName} started`);

  return container;
}

module.exports = {
  startContainer,
};
