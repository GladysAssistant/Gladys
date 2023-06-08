const fs = require('fs/promises');
const { constants } = require('fs');
const path = require('path');
const bcrypt = require('bcrypt');
const logger = require('../../../utils/logger');

/**
 * @description Configure Node-red container.
 * @param {object} config - Gladys Node-red stored configuration.
 * @returns {Promise} Indicates if the configuration file has been created or modified.
 * @example
 * await this.configureContainer({});
 */
async function configureContainer(config) {
  logger.info('NodeRed: Docker container is being configured...');

  const { basePathOnHost } = await this.gladys.system.getGladysBasePath();

  // Create configuration path (if not exists)
  const configFilepath = path.join(basePathOnHost, 'node-red', 'settings.js');
  await fs.mkdir(path.dirname(configFilepath), { recursive: true });
  // Check if config file not already exists
  let configCreated = false;
  try {
    // eslint-disable-next-line no-bitwise
    await fs.access(configFilepath, constants.R_OK | constants.W_OK);
    logger.info('NodeRed:  configuration file already exists.');
  } catch (e) {
    logger.info('NodeRed: Writting default configuration...');
    await fs.copyFile(path.join(__dirname, '../docker/settings.txt'), configFilepath);
    configCreated = true;
  }

  // Check for changes
  const fileContent = await fs.readFile(configFilepath);
  let fileContentString = fileContent.toString();

  const encodedPassword = bcrypt.hashSync(config.nodeRedPassword, 8);
  const [, username] = fileContentString.match(/username: '(.+)'/);
  const [, password] = fileContentString.match(/password: '(.+)'/);

  let configChanged = false;
  if (username !== config.nodeRedUsername || password !== encodedPassword) {
    fileContentString = fileContentString.replace(/username: '(.+)'/, `username: '${config.nodeRedUsername}'`);
    fileContentString = fileContentString.replace(/password: '(.+)'/, `password: '${encodedPassword}'`);
    configChanged = true;
  }

  if (configChanged) {
    logger.info('NodeRed: Writting configuration...');
    await fs.writeFile(configFilepath, fileContentString);
  }

  return configCreated || configChanged;
}

module.exports = {
  configureContainer,
};
