const fs = require('fs/promises');
const path = require('path');
const logger = require('../../../utils/logger');
const { DEFAULT } = require('./constants');

/**
 * @description Configure Matterbridge container directories.
 * @returns {Promise} Indicates if the configuration has been created or modified.
 * @example
 * await this.configureContainer();
 */
async function configureContainer() {
  logger.info('Matterbridge: Docker container is being configured...');

  const { basePathOnContainer } = await this.gladys.system.getGladysBasePath();

  // Create configuration paths (if not exists)
  const matterbridgePath = path.join(basePathOnContainer, DEFAULT.CONFIGURATION_PATH);
  const matterbridgeStoragePath = path.join(matterbridgePath, '.matterbridge');
  const matterbridgeCertPath = path.join(matterbridgePath, '.mattercert');
  const matterbridgePluginsPath = path.join(matterbridgePath, 'Matterbridge');

  await fs.mkdir(matterbridgePath, { recursive: true });
  await fs.mkdir(matterbridgeStoragePath, { recursive: true });
  await fs.mkdir(matterbridgeCertPath, { recursive: true });
  await fs.mkdir(matterbridgePluginsPath, { recursive: true });

  try {
    await fs.chown(matterbridgePath, 1000, 1000);
    await fs.chown(matterbridgeStoragePath, 1000, 1000);
    await fs.chown(matterbridgeCertPath, 1000, 1000);
    await fs.chown(matterbridgePluginsPath, 1000, 1000);
  } catch (e) {
    logger.error('Matterbridge: Unable to change ownership of the configuration directories');
  }

  logger.info('Matterbridge: configuration directories created');
  return true;
}

module.exports = {
  configureContainer,
};
