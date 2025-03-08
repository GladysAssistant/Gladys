const db = require('../../models');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');
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
  const start = Date.now();
  await db.sequelize.query('VACUUM;');
  logger.info('VACUUM finished.');
  this.event.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.SYSTEM.VACUUM_FINISHED,
    payload: {
      duration: Date.now() - start,
    },
  });
}

module.exports = {
  vacuum,
};
