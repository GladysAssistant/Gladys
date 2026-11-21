const { promisify } = require('util');
const execFile = promisify(require('child_process').execFile);
const fse = require('fs-extra');

const TAR_TIMEOUT_MS = 60 * 1000;

/**
 * @description Path of the archive made while backing up or restoring a storage folder, next to it.
 * @param {string} storagePath - Storage folder of the bridge.
 * @returns {string} Archive path.
 * @example
 * archivePathOf('/var/lib/gladysassistant/matter-bridge');
 */
function archivePathOf(storagePath) {
  return `${storagePath}-backup.tar.gz`;
}

/**
 * @description Tell if the storage folder holds nothing: missing or empty.
 * @param {string} storagePath - Storage folder of the bridge.
 * @returns {Promise<boolean>} True when there is nothing in it.
 * @example
 * await isStorageEmpty('/var/lib/gladysassistant/matter-bridge');
 */
async function isStorageEmpty(storagePath) {
  if (!(await fse.pathExists(storagePath))) {
    return true;
  }
  return (await fse.readdir(storagePath)).length === 0;
}

/**
 * @description Make a gzipped tar of the content of the storage folder.
 * @param {string} storagePath - Storage folder of the bridge.
 * @returns {Promise<string>} The archive, in base64.
 * @example
 * const backup = await createBackup('/var/lib/gladysassistant/matter-bridge');
 */
async function createBackup(storagePath) {
  const archivePath = archivePathOf(storagePath);
  try {
    // The content of the folder, not the folder itself: it is restored into the storage folder of
    // the day, whatever its name.
    await execFile('tar', ['-czf', archivePath, '-C', storagePath, '.'], { timeout: TAR_TIMEOUT_MS });
    return await fse.readFile(archivePath, 'base64');
  } finally {
    await fse.remove(archivePath);
  }
}

/**
 * @description Put the content of a backup back into the storage folder.
 * @param {string} storagePath - Storage folder of the bridge.
 * @param {string} backup - The archive, in base64, from createBackup.
 * @returns {Promise} Resolves once the folder is restored.
 * @example
 * await restoreBackup('/var/lib/gladysassistant/matter-bridge', backup);
 */
async function restoreBackup(storagePath, backup) {
  const archivePath = archivePathOf(storagePath);
  await fse.ensureDir(storagePath);
  try {
    await fse.writeFile(archivePath, backup, 'base64');
    await execFile('tar', ['-xzf', archivePath, '-C', storagePath], { timeout: TAR_TIMEOUT_MS });
  } catch (e) {
    // Half a storage is worse than none: matter.js would start from it.
    await fse.emptyDir(storagePath);
    throw e;
  } finally {
    await fse.remove(archivePath);
  }
}

module.exports = {
  isStorageEmpty,
  createBackup,
  restoreBackup,
};
