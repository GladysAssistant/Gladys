const db = require('../../models');
const logger = require('../../utils/logger');

/**
 * @description Save new device feature state in DB.
 * @param {Object} deviceFeature - A DeviceFeature object.
 * @param {number} newValue - The new value of the deviceFeature to save.
 * @example
 * saveState({
 *   id: 'fc235c88-b10d-4706-8b59-fef92a7119b2',
 *   selector: 'my-light'
 * }, 12);
 */
async function saveState(deviceFeature, newValue) {
  logger.debug(`device.saveState of deviceFeature ${deviceFeature.selector}`);
  await db.sequelize.transaction(async (t) => {
    // update deviceFeature lastValue in DB
    await db.DeviceFeature.update(
      {
        last_value: newValue,
        last_value_changed: new Date(),
      },
      {
        where: {
          id: deviceFeature.id,
        },
      },
      {
        transaction: t,
      },
    );
    // if the deviceFeature should keep history, we save a new deviceFeatureState
    if (deviceFeature.keep_history) {
      await db.DeviceFeatureState.create(
        {
          device_feature_id: deviceFeature.id,
          value: newValue,
        },
        {
          transaction: t,
        },
      );
    }

    // save local state in RAM
    this.stateManager.setState('deviceFeature', deviceFeature.selector, {
      lastValue: newValue,
    });
  });
}

module.exports = {
  saveState,
};
