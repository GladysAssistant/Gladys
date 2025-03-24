const { PlatformNotCompatible } = require('../../utils/coreErrors');

/**
 * @description Install new upgrade.
 * @example
 * await installUpgrade();
 */
async function installUpgrade() {
  // if the system is not running docker, exit
  if (!this.dockerode) {
    throw new PlatformNotCompatible('SYSTEM_NOT_RUNNING_DOCKER');
  }

  // Create and start Watchtower container
  const container = await this.dockerode.createContainer({
    Image: 'containrrr/watchtower',
    name: `gladys-watchtower-${Date.now()}`,
    HostConfig: {
      AutoRemove: true,
      Binds: ['/var/run/docker.sock:/var/run/docker.sock'],
    },
    Cmd: ['--run-once'],
  });

  // Start the container
  await container.start();

  // Wait for container to finish
  const { StatusCode } = await container.wait();

  if (StatusCode !== 0) {
    throw new Error(`Watchtower container exited with status code ${StatusCode}`);
  }
}

module.exports = {
  installUpgrade,
};
