const { Op } = require('sequelize');
const db = require('../../models');
const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

/**
 * @description Purge device aggregate states.
 * @returns {Promise} Resolve when finished.
 * @example
 * device.purgeAggregateStates();
 */
async function purgeAggregateStates() {
  logger.debug('Purging device feature aggregate states...');
  const deviceAggregateStateHistoryInDays = await this.variable.getValue(
    SYSTEM_VARIABLE_NAMES.DEVICE_AGGREGATE_STATE_HISTORY_IN_DAYS,
  );
  const deviceAggregateStateHistoryInDaysInt = parseInt(deviceAggregateStateHistoryInDays, 10);
  if (Number.isNaN(deviceAggregateStateHistoryInDaysInt)) {
    logger.debug('Not purging device feature aggregate states, deviceAggregateStateHistoryInDays is not an integer.');
    return Promise.resolve(false);
  }
  if (deviceAggregateStateHistoryInDaysInt === -1) {
    logger.debug('Not purging device feature aggregate states, deviceAggregateStateHistoryInDays = -1');
    return Promise.resolve(false);
  }
  const queryInterface = db.sequelize.getQueryInterface();
  const now = new Date().getTime();
  // all date before this timestamp will be removed
  const timstampLimit = now - deviceAggregateStateHistoryInDaysInt * 24 * 60 * 60 * 1000;
  const dateLimit = new Date(timstampLimit);
  logger.info(
    `Purging device feature states of the last ${deviceAggregateStateHistoryInDaysInt} days. States older than ${dateLimit} will be purged.`,
  );
  await queryInterface.bulkDelete('t_device_feature_state_aggregate', {
    created_at: {
      [Op.lte]: dateLimit,
    },
  });
  return true;
}

module.exports = {
  purgeAggregateStates,
};
