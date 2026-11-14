const fsPromises = require('fs/promises');
const JSZip = require('jszip');
const path = require('path');

const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');

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
  logger.info('Zigbee2mqtt: loading z2m backup...');
  const z2mBackup = await this.gladys.variable.getValue(CONFIGURATION.Z2M_BACKUP, this.serviceId);
  if (z2mBackup) {
    logger.info('Restoring zigbee2mqtt configuration...');
    // Stored z2m backup is a base64 zip file
    // 1. Decoding base64 content
    const zip = new JSZip();
    const { files } = await zip.loadAsync(z2mBackup, { base64: true });

    // The folders of the backup (such as external converters) are created with their files. The names of the entries
    // are sanitized by JSZip (no "..")
    const results = await Promise.allSettled(
      Object.values(files)
        .filter((file) => !file.dir)
        .map(async (file) => {
          const filePath = path.join(containerPath, file.name);
          await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
          const content = await file.async('arraybuffer');
          // Without configuration file, the files left in the folder (such as a database written since the backup) are
          // newer than those of the backup: they are kept, even when created while restoring
          try {
            await fsPromises.writeFile(filePath, Buffer.from(content), { flag: 'wx' });
          } catch (e) {
            if (e.code === 'EEXIST') {
              return;
            }
            // Created by this write: cut short (disk full), it would be kept by the next restore
            await fsPromises.rm(filePath, { force: true });
            throw e;
          }
        }),
    );
    // Thrown once every write has ended: a file still being written would be created after its caller removed it
    const failure = results.find((result) => result.status === 'rejected');
    if (failure) {
      throw failure.reason;
    }
  } else {
    logger.info('No zigbee2mqtt backup avaiable');
  }
}

module.exports = {
  restoreZ2mBackup,
};
