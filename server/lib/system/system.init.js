const fse = require('fs-extra');
const path = require('path');
const logger = require('../../utils/logger');

/**
 * @description Init the system, connect to docker if in docker.
 * @example
 * init();
 */
async function init() {
  // Clean temp folder
  await fse.emptyDir(this.config.tempFolder);
  // Ensure temp directory exists
  await fse.ensureDir(this.config.tempFolder);
  // we get Gladys version from package.json
  const packageJsonString = await fse.readFile(path.join(__dirname, '../../../package.json'), 'utf8');
  const packageJson = JSON.parse(packageJsonString);
  // and save it in the object
  this.gladysVersion = `v${packageJson.version}`;
  try {
    // we create a new dockerode instance
    const dockerode = new this.Docker();
    // if we can contact a docker daemon, this should not fail
    await dockerode.listContainers();
    // and we should go there.
    // If it fails, it will go to catch and it means
    // docker dameon is not available on this machine.
    this.dockerode = dockerode;
  } catch (e) {
    if (e && e.errno === 'ENOENT') {
      logger.info(`System.init: This system doesn't have a docker dameon available.`);
    }
  }
}

module.exports = {
  init,
};
