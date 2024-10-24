const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');
const { exec } = require('../../utils/childProcess');

/**
 * @description Update containers.
 * @example
 * const state = await updateContainers();
 */
async function updateContainers() {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const command = `docker run --rm -v /var/run/docker.sock:/var/run/docker.sock containrrr/watchtower --cleanup --include-restarting --run-once`;

  logger.info(`Updating all containers`);
  await exec(command);
  
}

module.exports = {
  updateContainers,
};
