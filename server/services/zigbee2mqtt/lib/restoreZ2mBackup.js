const fsPromises = require('fs/promises');
const JSZip = require('jszip');
const path = require('path');

const logger = require('../../../utils/logger');

/**
 * @description Restore z2m backup from database.
 * @param {string} containerPath - Zigbee2MQTT configuration directory.
 * @returns {Promise} Empty promise.
 * @example
 * await z2m.restoreZ2mBackup(configPath);
 */
async function restoreZ2mBackup(containerPath) {
  await fsPromises.mkdir(containerPath, { recursive: true });
  // Check if configuration is already available
  const z2mFiles = await fsPromises.readdir(containerPath);
  if (z2mFiles.includes('configuration.yaml')) {
    // Configuration is present, do not restore backup
    logger.debug('zigbee2mqtt configuration already here, skip restore backup');
    return;
  }

  // Check if backup is stored
  const z2mBackup = await this.getZ2mBackup();
  if (z2mBackup) {
    logger.info('Restoring zigbee2mqtt configuration...');
    // Stored z2m backup is a base64 zip file
    // 1. Decoding base64 content
    const zip = new JSZip();
    const { files } = await zip.loadAsync(z2mBackup, { base64: true });

    await Promise.all(
      Object.values(files).map(async (file) => {
        const content = await file.async('arraybuffer');
        return fsPromises.writeFile(path.join(containerPath, file.name), Buffer.from(content));
      }),
    );
  } else {
    logger.info('No zigbee2mqtt backup avaiable');
  }
}

module.exports = {
  restoreZ2mBackup,
};
