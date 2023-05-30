const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Vacuum Gladys database.
 * @example
 * vacuum();
 */
async function vacuum() {
  // SQLite VACUUM is a blocking task that will clean
  // the database from deleted data. It reduces the database size
  // on disk.
  // Warning: This operations is blocking and takes time to run
  // on big databases
  // Read: https://www.sqlite.org/lang_vacuum.html
  logger.info('Running VACUUM command to free up space.');
  await db.sequelize.query('VACUUM;');
}

module.exports = {
  vacuum,
};
