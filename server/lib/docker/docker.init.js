const logger = require('../../utils/logger');

/**
 * @description Init Docker use, connect Gladys to docker if in docker
 * @example
 * init();
 */
async function init() {
  try {
    // we create a new dockerode instance
    const dockerode = new this.Dockerode();
    // if we can contact a docker daemon, this should not fail
    await dockerode.listContainers();
    // and we should go there.
    // If it fails, it will go to catch and it means
    // docker daemon is not available on this machine.
    this.dockerode = dockerode;
  } catch (e) {
    if (e && e.errno === 'ENOENT') {
      logger.info(`System.init: This system doesn't have a docker daemon available.`);
    }
  }
}

module.exports = {
  init,
};
