const { Op } = require('sequelize');
const db = require('../../models');
const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

/**
 * @description Purge device states
 * @returns {Promise} Resolve when finished.
 * @example
 * device.purgeStates();
 */
async function purgeStates() {
  logger.debug('Purging device feature states...');
  const deviceStateHistoryInDays = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS);
  const deviceStateHistoryInDaysInt = parseInt(deviceStateHistoryInDays, 10);
  if (Number.isNaN(deviceStateHistoryInDaysInt)) {
    logger.debug('Not purging device feature states, deviceStateHistoryInDays is not an integer.');
    return Promise.resolve(false);
  }
  if (deviceStateHistoryInDaysInt === -1) {
    logger.debug('Not purging device feature states, deviceStateHistoryInDays = -1');
    return Promise.resolve(false);
  }
  const queryInterface = db.sequelize.getQueryInterface();
  const now = new Date().getTime();
  // all date before this timestamp will be removed
  const timstampLimit = now - deviceStateHistoryInDaysInt * 24 * 60 * 60 * 1000;
  const dateLimit = new Date(timstampLimit);
  logger.info(
    `Purging device feature states of the last ${deviceStateHistoryInDaysInt} days. States older than ${dateLimit} will be purged.`,
  );
  await queryInterface.bulkDelete('t_device_feature_state', {
    created_at: {
      [Op.lte]: dateLimit,
    },
  });
  return true;
}

/**
 * @description Purge device states
 * @param {Object} deviceFeature - A DeviceFeature object.
 * @returns {Promise} Resolve when finished.
 * @example
 * device.purgeStatesAggregates();
 */
async function purgeStatesAggregates(deviceFeature) {
  logger.debug('Purging device feature states and aggregates...');

  // we bulk insert the data
  const queryInterface = db.sequelize.getQueryInterface();
  await queryInterface.bulkDelete('t_device_feature_state', { device_feature_id: deviceFeature.id });
  logger.info(`Purging device feature states with option no keep history selected.`);
  await queryInterface.bulkDelete('t_device_feature_state_aggregate', {
    device_feature_id: deviceFeature.id,
  });
  logger.info(`Purging device feature aggregates with option no keep history selected.`);
  return true;
}

module.exports = {
  purgeStates,
  purgeStatesAggregates,
};
