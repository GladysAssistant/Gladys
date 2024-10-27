const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');

/**
 * @description Update containers.
 * @example
 * await updateContainers();
 */
async function updateContainers() {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  const watchtowerImage = 'containrrr/watchtower';

  logger.info(`Pulling ${watchtowerImage} image...`);
  await this.pull(watchtowerImage);

  try {
    const container = await this.dockerode.createContainer({
      Image: watchtowerImage,
      Cmd: ['--run-once', '--cleanup', '--include-restarting'],
      HostConfig: {
          AutoRemove: true,
          Binds: [
              '/var/run/docker.sock:/var/run/docker.sock' // Mounted to access the Docker API.
          ]
      },
      Tty: false
    });

    await container.start();
    logger.info('Watchtower container is running.');

    // Wait for the container to finish and delete it.
    await container.wait();
    logger.info('Watchtower has completed its run.');

  } catch (e) {
    logger.debug('Error running Watchtower:', e);
  }
  
}

module.exports = {
  updateContainers,
};
