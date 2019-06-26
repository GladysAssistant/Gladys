const { Op } = require('sequelize');
const db = require('../../models');
const logger = require('../../utils/logger');
const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

/**
 * @description Purge device states
 * @example
 * device.purgeStates();
 */
async function purgeStates() {
  logger.debug('Purging device feature states...');
  const deviceStateHistoryInDays = await this.variable.getValue(SYSTEM_VARIABLE_NAMES.DEVICE_STATE_HISTORY_IN_DAYS);
  const deviceStateHistoryInDaysInt = parseInt(deviceStateHistoryInDays, 10);
  if (Number.isNaN(deviceStateHistoryInDaysInt)) {
    logger.debug('Not purging device feature states.');
    return;
  }
  const queryInterface = db.sequelize.getQueryInterface();
  const now = new Date().getTime();
  // all date before this timestamp will be removed
  const timstampLimit = now - deviceStateHistoryInDaysInt * 24 * 60 * 60 * 1000;
  await queryInterface.bulkDelete('t_device_feature_state', {
    created_at: {
      [Op.lte]: new Date(timstampLimit),
    },
  });
}

module.exports = {
  purgeStates,
};
