const db = require('../../models');
const logger = require('../../utils/logger');
const { BadParameters } = require('../../utils/coreErrors');

/**
 * @description Save hstorical device feature state in DB.
 * @param {Object} deviceFeature - A DeviceFeature object.
 * @param {Object} historicalState - The historical feature state object of the deviceFeature to save.
 * @param {Object} createdAt - Date of state.
 * @example
 * saveHistoricalState({
 *      id: 'fc235c88-b10d-4706-8b59-fef92a7119b2',
 *      selector: 'my-light'
 *    },
 *    'newValue',
 *    '2022-02-03'
 * );
 */
async function saveHistoricalState(deviceFeature, historicalState, createdAt) {
  logger.debug(`device.saveHistoricalState of deviceFeature ${deviceFeature.selector}`, historicalState);

  if (Number.isNaN(historicalState)) {
    throw new BadParameters(`device.saveHistoricalState of NaN value on ${deviceFeature.selector}`);
  }
  // get current feture to update last value if needed
  const deviceFeatureInDB = await db.DeviceFeature.findOne({
    where: {
      id: deviceFeature.id,
    },
  });

  const historicalStateObject = {
    device_feature_id: deviceFeatureInDB.id,
    value: historicalState,
    created_at: createdAt,
  };

  await db.DeviceFeatureState.create(historicalStateObject);

  const historicalStateAfterFeatureLastValue =
    new Date(historicalStateObject.created_at) > new Date(deviceFeatureInDB.last_value_changed);
  const featureLastValueChageIsValidDate =
    deviceFeatureInDB.last_value_changed instanceof Date &&
    !Number.isNaN(deviceFeatureInDB.last_value_changed.getTime());

  if (historicalStateAfterFeatureLastValue || !featureLastValueChageIsValidDate) {
    await db.DeviceFeature.update(
      {
        last_value: historicalStateObject.value,
        last_value_changed: historicalStateObject.created_at,
      },
      {
        where: {
          id: deviceFeature.id,
        },
      },
    );

    deviceFeature.last_value = historicalState.value;
    deviceFeature.last_value_changed = historicalState.updated_at;

    // save local state in RAM
    this.stateManager.setState('deviceFeature', deviceFeature.selector, deviceFeature);
  }
}

module.exports = {
  saveHistoricalState,
};
