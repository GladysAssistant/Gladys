const { promisify } = require('util');
const execFile = promisify(require('child_process').execFile);
const fse = require('fs-extra');

const path = require('path');

const TAR_TIMEOUT_MS = 60 * 1000;

// Left out of a backup: files matter.js is writing (it writes each value to a .tmp file, then
// renames it over the old one), and the lock of the running process.
const EXCLUDED = (name) => name.endsWith('.tmp') || name === 'matter.lock' || name === 'matter.pid';

/**
 * @description Copy the storage folder while matter.js runs. Each value is a file that matter.js
 * replaces in one rename, so every file copied is whole; a file removed meanwhile is skipped.
 * @param {string} source - Storage folder.
 * @param {string} target - Snapshot folder.
 * @returns {Promise} Resolves once copied.
 * @example
 * await copySnapshot('/var/lib/gladysassistant/matter-bridge', '/tmp/snapshot');
 */
async function copySnapshot(source, target) {
  await fse.ensureDir(target);
  const entries = await fse.readdir(source, { withFileTypes: true });
  // eslint-disable-next-line no-restricted-syntax
  for (const entry of entries) {
    if (!EXCLUDED(entry.name)) {
      const from = path.join(source, entry.name);
      const to = path.join(target, entry.name);
      try {
        // eslint-disable-next-line no-await-in-loop
        await (entry.isDirectory() ? copySnapshot(from, to) : fse.copyFile(from, to));
      } catch (e) {
        if (e.code !== 'ENOENT') {
          throw e;
        }
      }
    }
  }
}

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
 * @description Make a gzipped tar of the content of the storage folder, without stopping the
 * bridge: a snapshot of the folder is archived, not the folder matter.js keeps writing to.
 * @param {string} storagePath - Storage folder of the bridge.
 * @returns {Promise<string>} The archive, in base64.
 * @example
 * const backup = await createBackup('/var/lib/gladysassistant/matter-bridge');
 */
async function createBackup(storagePath) {
  const archivePath = archivePathOf(storagePath);
  const snapshotPath = `${storagePath}-snapshot`;
  try {
    await fse.remove(snapshotPath);
    await copySnapshot(storagePath, snapshotPath);
    // The content of the folder, not the folder itself: it is restored into the storage folder of
    // the day, whatever its name.
    await execFile('tar', ['-czf', archivePath, '-C', snapshotPath, '.'], { timeout: TAR_TIMEOUT_MS });
    return await fse.readFile(archivePath, 'base64');
  } finally {
    await fse.remove(snapshotPath);
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
