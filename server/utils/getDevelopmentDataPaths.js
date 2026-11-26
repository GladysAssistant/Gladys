const fs = require('fs');
const path = require('path');

// In development, the database and whatever Gladys stores next to it (DuckDB, the backups,
// the storage of the Matter controller...) go to this single folder, which git, Docker and
// nodemon ignore.
const DATA_FOLDER = './gladys-data';

const CURRENT_PATHS = Object.freeze({
  storage: `${DATA_FOLDER}/gladys-development.db`,
  backupsFolder: `${DATA_FOLDER}/backups`,
});

// Before the data folder existed, the development data lived at the root of `server/`.
const LEGACY_PATHS = Object.freeze({
  storage: './gladys-development.db',
  backupsFolder: './gladys-backups',
});

/**
 * @description Return where the development database and backups are stored. A checkout
 * whose database is still at the root of `server/` keeps using it: nothing is ever moved or
 * deleted, moving the data to the data folder is left to the developer. This only reads the
 * file system.
 * @param {string} [root] - Folder the paths are relative to (the working directory).
 * @returns {{storage: string, backupsFolder: string}} Paths, relative to the root.
 * @example
 * const { storage, backupsFolder } = getDevelopmentDataPaths();
 */
function getDevelopmentDataPaths(root = '.') {
  const hasCurrentDatabase = fs.existsSync(path.join(root, CURRENT_PATHS.storage));
  const hasLegacyDatabase = fs.existsSync(path.join(root, LEGACY_PATHS.storage));
  return !hasCurrentDatabase && hasLegacyDatabase ? LEGACY_PATHS : CURRENT_PATHS;
}

module.exports = {
  getDevelopmentDataPaths,
};
