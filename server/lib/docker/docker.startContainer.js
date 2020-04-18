const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Start container.
 * @param containerName
 * @returns
 * @example
 * const container = await startContainer();
 */
async function startContainer(containerName) {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const container = await this.dockerode.getContainer(containerName).start();

  logger.info(`container ${containerName} start : ${container}`);

  return container;
}

module.exports = {
  startContainer,
};
