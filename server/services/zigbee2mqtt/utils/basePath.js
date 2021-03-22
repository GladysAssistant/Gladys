/**
 * @description Compute basePath from SQLITE_FILE_PATH or give default one.
 * @returns {string} Base path to store files.
 * @example
 * basePath();
 */
function basePath() {
  if (process.env.SQLITE_FILE_PATH) {
    const base = process.env.SQLITE_FILE_PATH;
    return base.substring(0, base.lastIndexOf('/'));
  }
  return '/var/lib/gladysassistant';
}

module.exports = {
  basePath,
};
