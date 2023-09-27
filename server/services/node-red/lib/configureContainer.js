const fs = require('fs/promises');
const { constants } = require('fs');
const path = require('path');
const logger = require('../../../utils/logger');
const passwordUtils = require('../../../utils/password');
const { DEFAULT } = require('./constants');

/**
 * @description Configure Node-RED container.
 * @param {object} config - Gladys Node-RED stored configuration.
 * @returns {Promise} Indicates if the configuration file has been created or modified.
 * @example
 * await this.configureContainer({});
 */
async function configureContainer(config) {
  logger.info('Node-RED: Docker container is being configured...');

  const { basePathOnContainer } = await this.gladys.system.getGladysBasePath();

  // Create configuration path (if not exists)
  const configFilepath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
  await fs.mkdir(path.dirname(configFilepath), { recursive: true });
  try {
    await fs.chown(path.dirname(configFilepath), 1000, 1000);
  } catch (e) {
    logger.error('Node-RED: Unable to change write of the configuration');
  }

  // Check if config file not already exists
  let configCreated = false;
  try {
    // eslint-disable-next-line no-bitwise
    await fs.access(configFilepath, constants.R_OK | constants.W_OK);
    logger.info('Node-RED:  configuration file already exists.');
  } catch (e) {
    logger.info('Node-RED: Writing default configuration...');
    await fs.copyFile(path.join(__dirname, '../docker/settings.txt'), configFilepath);
    configCreated = true;
  }

  const fileContent = await fs.readFile(configFilepath);
  let fileContentString = fileContent.toString();

  let configChanged = false;
  if (config.nodeRedPassword && config.nodeRedUsername) {
    // Check for changes
    const [, username] = fileContentString.match(/username: '(.+)'/);
    const [, password] = fileContentString.match(/password: '(.+)'/);

    if (
      username !== config.nodeRedUsername ||
      (await passwordUtils.compare(config.nodeRedPassword, password)) === false
    ) {
      const encodedPassword = await passwordUtils.hash(config.nodeRedPassword, 8);
      fileContentString = fileContentString.replace(/username: '(.+)'/, `username: '${config.nodeRedUsername}'`);
      fileContentString = fileContentString.replace(/password: '(.+)'/, `password: '${encodedPassword}'`);

      configChanged = true;
    }
  }

  if (configChanged) {
    logger.info('Node-RED: Writting configuration...');
    await fs.writeFile(configFilepath, fileContentString);
  }

  return configCreated || configChanged;
}

module.exports = {
  configureContainer,
};
