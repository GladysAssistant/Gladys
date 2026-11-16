const fs = require('fs');
const path = require('path');

const logger = require('./logger');

/**
 * @description List what Gladys keeps next to its SQLite database: the database and its
 * journal files, the DuckDB database and its journal, and the storage of the Matter controller.
 * @param {string} storage - Path of the SQLite database.
 * @returns {Array<string>} Names of the files and folders, relative to the data folder.
 * @example
 * getDataFolderEntries('./gladys-data/gladys-development.db');
 */
function getDataFolderEntries(storage) {
  const sqliteFile = path.basename(storage);
  const duckDbFile = `${sqliteFile.replace('.db', '')}.duckdb`;
  return [sqliteFile, `${sqliteFile}-wal`, `${sqliteFile}-shm`, duckDbFile, `${duckDbFile}.wal`, 'matter'];
}

/**
 * @description Make sure the folder of the SQLite database exists before the databases are
 * opened: it is the data folder of the instance, where Gladys also stores what it keeps next
 * to its database. When the configuration names a legacy data folder (development only: the
 * data used to live at the root of `server/`, among the source files), the data found there is
 * moved to the data folder once, so that a developer keeps their database.
 * @param {object} config - Configuration of the current environment (see config/config.js).
 * @param {string} config.storage - Path of the SQLite database.
 * @param {string} [config.legacyDataFolder] - Folder where the data lived before, if any.
 * @returns {Array<string>} Names of the files and folders moved from the legacy data folder.
 * @example
 * prepareDataFolder(getConfig());
 */
function prepareDataFolder(config) {
  const dataFolder = path.dirname(config.storage);
  fs.mkdirSync(dataFolder, { recursive: true });

  const { legacyDataFolder } = config;
  if (!legacyDataFolder) {
    return [];
  }
  const sqliteFile = path.basename(config.storage);
  // Never touch a data folder that already has a database, and there is nothing to move
  // when the legacy folder has none.
  if (fs.existsSync(config.storage) || !fs.existsSync(path.join(legacyDataFolder, sqliteFile))) {
    return [];
  }
  const moved = getDataFolderEntries(config.storage).filter((entry) => {
    const from = path.join(legacyDataFolder, entry);
    const to = path.join(dataFolder, entry);
    if (!fs.existsSync(from) || fs.existsSync(to)) {
      return false;
    }
    fs.renameSync(from, to);
    return true;
  });
  logger.info(
    `Development data moved from "${path.resolve(legacyDataFolder)}" to "${path.resolve(dataFolder)}": ${moved.join(
      ', ',
    )}`,
  );
  return moved;
}

module.exports = {
  prepareDataFolder,
};
