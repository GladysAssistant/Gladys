const { randomUUID } = require('crypto');
const fsPromises = require('fs/promises');
const JSZip = require('jszip');
const path = require('path');

const logger = require('../../../utils/logger');
const { CONFIGURATION } = require('./constants');

const CONFIGURATION_FILE = 'configuration.yaml';

/**
 * @description Write a file of the Z2M backup. A file left in the folder (such as a database written since the backup)
 * is newer than the one of the backup: it is kept, even when created while restoring. A file to replace is set aside,
 * as <name>.invalid-<date>, and the restored one takes its place once whole: the folder never lacks it.
 * @param {string} filePath - Path of the file.
 * @param {Buffer} content - Content of the file in the backup.
 * @param {boolean} replace - Is the file left in the folder to replace?
 * @example
 * await writeRestoredFile('/var/lib/gladysassistant/zigbee2mqtt/z2m/database.db', content, false);
 */
async function writeRestoredFile(filePath, content, replace) {
  if (replace) {
    // One per write, not to rename the file of another write
    const temporaryFilePath = `${filePath}.${randomUUID()}.tmp`;
    try {
      await fsPromises.writeFile(temporaryFilePath, content);
      // Dated, not to replace a file set aside before
      await fsPromises.copyFile(filePath, `${filePath}.invalid-${new Date().toISOString().replace(/:/g, '-')}`);
      await fsPromises.rename(temporaryFilePath, filePath);
    } catch (e) {
      await fsPromises.rm(temporaryFilePath, { force: true });
      throw e;
    }
    return;
  }
  try {
    await fsPromises.writeFile(filePath, content, { flag: 'wx' });
  } catch (e) {
    if (e.code === 'EEXIST') {
      return;
    }
    // Created by this write: cut short (disk full), it would be kept by the next restore
    await fsPromises.rm(filePath, { force: true });
    throw e;
  }
}

/**
 * @description Restore z2m backup from database. The configuration file is written last, once every other file is: a
 * backup restored in part never writes it, as the next start would keep it as it is.
 * @param {string} containerPath - Zigbee2MQTT configuration directory.
 * @param {Array<string>} filesToReplace - Files of the folder that the ones of the backup replace (such as a file cut
 * short), set aside as <name>.invalid-<date>. The other files of the folder are kept.
 * @returns {Promise} Empty promise.
 * @example
 * await z2m.restoreZ2mBackup(configPath);
 */
async function restoreZ2mBackup(containerPath, filesToReplace = []) {
  await fsPromises.mkdir(containerPath, { recursive: true });
  // Check if configuration is already available
  const z2mFiles = await fsPromises.readdir(containerPath);
  if (z2mFiles.includes(CONFIGURATION_FILE) && !filesToReplace.includes(CONFIGURATION_FILE)) {
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
    const restoreFile = async (file) => {
      const filePath = path.join(containerPath, file.name);
      await fsPromises.mkdir(path.dirname(filePath), { recursive: true });
      const content = await file.async('arraybuffer');
      await writeRestoredFile(filePath, Buffer.from(content), filesToReplace.includes(file.name));
    };
    const backupFiles = Object.values(files).filter((file) => !file.dir);
    const configurationFile = backupFiles.find((file) => file.name === CONFIGURATION_FILE);
    const results = await Promise.allSettled(
      backupFiles.filter((file) => file !== configurationFile).map((file) => restoreFile(file)),
    );
    // Thrown once every write has ended: a write still running would race with the next restore
    const failure = results.find((result) => result.status === 'rejected');
    if (failure) {
      throw failure.reason;
    }
    if (configurationFile) {
      await restoreFile(configurationFile);
    }
  } else {
    logger.info('No zigbee2mqtt backup avaiable');
  }
}

module.exports = {
  restoreZ2mBackup,
};
