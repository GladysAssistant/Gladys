const Promise = require('bluebird');
const { Op } = require('sequelize');
const db = require('../../models');
const logger = require('../../utils/logger');

const DAYS_TO_KEEP = 7;

/**
 * @public
 * @description Purge.
 * @returns {Promise} Resolve.
 * @example
 * gladys.job.purge(');
 */
async function purge() {
  const deleteBeforeDate = new Date(new Date().getTime() - DAYS_TO_KEEP * 24 * 60 * 60 * 1000);
  logger.info(`Deleting all background jobs created before = ${deleteBeforeDate}`);
  await db.Job.destroy({
    where: {
      created_at: {
        [Op.lte]: deleteBeforeDate,
      },
    },
  });
}

module.exports = {
  purge,
};
