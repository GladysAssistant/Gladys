const { PlatformNotCompatible } = require('../../utils/coreErrors');
const logger = require('../../utils/logger');
// const { exec } = require('../../utils/childProcess');

/**
 * @description Update containers.
 * @example
 * const state = await updateContainers();
 */
async function updateContainers() {
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  // const command = `/usr/bin/docker run --rm -v /var/run/docker.sock:/var/run/docker.sock 
  // containrrr/watchtower --cleanup --include-restarting --run-once`;

  // logger.info(`Updating all containers`);
  // await exec(command);


  const container = await this.dockerode.createContainer({
    Image: 'containrrr/watchtower',
    Cmd: ['--run-once', '--cleanup', '--include-restarting'],
    HostConfig: {
        AutoRemove: true,
        Binds: [
            '/var/run/docker.sock:/var/run/docker.sock' // Monté pour accéder à l'API Docker
        ]
    },
    Tty: false
  });

  await container.start();
  logger.info('Watchtower container is running.');

  // Attendre que le conteneur se termine et le supprimer
  await container.wait();
  logger.info('Watchtower has completed its run.');
  
}

module.exports = {
  updateContainers,
};
