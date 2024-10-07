const { Op } = require('sequelize');
const db = require('../../models');
const logger = require('../../utils/logger');

const DAYS_TO_KEEP = 15;

/**
 * @public
 * @description Purge.
 * @returns {Promise} Resolve.
 * @example
 * gladys.message.purge();
 */
async function purge() {
  const deleteBeforeDate = new Date(new Date().getTime() - DAYS_TO_KEEP * 24 * 60 * 60 * 1000);
  logger.info(`Deleting all messages created before = ${deleteBeforeDate}`);
  await db.Message.destroy({
    where: {
      created_at: {
        [Op.lte]: deleteBeforeDate,
      },
    },
  });
  logger.info('Messages purged!');
}

module.exports = {
  purge,
};
