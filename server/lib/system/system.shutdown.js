const logger = require('../../utils/logger');

/**
 * @description Shutdown Gladys instance.
 * @example
 * shutdown();
 */
async function shutdown() {
  // gracefully shutdown db
  try {
    await this.sequelize.close();
  } catch (e) {
    logger.info('Database is probably already closed');
    logger.warn(e);
  }
  // exit
  process.exit();
}

module.exports = {
  shutdown,
};
