const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Purge device states of a specific feature
 * @param {string} deviceFeatureId - Id of a device feature.
 * @returns {Promise} Resolve when finished.
 * @example
 * device.purgeStatesByFeatureId('d47b481b-a7be-4224-9850-313cdb8a4065');
 */
async function purgeStatesByFeatureId(deviceFeatureId) {
  logger.info(`Purging states of device feature ${deviceFeatureId}`);
  const queryInterface = db.sequelize.getQueryInterface();
  await queryInterface.bulkDelete('t_device_feature_state', {
    device_feature_id: deviceFeatureId,
  });
  await queryInterface.bulkDelete('t_device_feature_state_aggregate', {
    device_feature_id: deviceFeatureId,
  });
}

module.exports = {
  purgeStatesByFeatureId,
};
