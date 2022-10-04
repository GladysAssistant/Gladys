const db = require('../../models');
const logger = require('../../utils/logger');
const { BadParameters } = require('../../utils/coreErrors');

/**
 * @description Save historical device feature state in DB.
 * @param {Object} deviceFeature - A DeviceFeature object.
 * @param {number} historicalState - The historical feature state value (numeric) of the deviceFeature to save.
 * @param {Object} createdAt - Date of state.
 * @example
 * saveHistoricalState({
 *      id: 'fc235c88-b10d-4706-8b59-fef92a7119b2',
 *      selector: 'my-light'
 *    },
 *    50,
 *    '2022-03-09T11:30:19.000'
 * );
 */
async function saveHistoricalState(deviceFeature, historicalState, createdAt) {
  logger.debug(`device.saveHistoricalState of deviceFeature ${deviceFeature.selector}`, historicalState);

  if (Number.isNaN(historicalState)) {
    throw new BadParameters(`device.saveHistoricalState of NaN value on ${deviceFeature.selector}`);
  }
  // get current feature to update last value if needed
  const previousDeviceFeature = this.stateManager.get('deviceFeature', deviceFeature.selector);

  const historicalStateObject = {
    device_feature_id: previousDeviceFeature.id,
    value: historicalState,
    created_at: createdAt,
  };

  await db.DeviceFeatureState.create(historicalStateObject);

  const historicalStateAfterFeatureLastValue =
    new Date(historicalStateObject.created_at) > new Date(previousDeviceFeature.last_value_changed);
  const featureLastValueChangeIsValidDate =
    previousDeviceFeature.last_value_changed instanceof Date &&
    !Number.isNaN(previousDeviceFeature.last_value_changed.getTime());

  if (historicalStateAfterFeatureLastValue || !featureLastValueChangeIsValidDate) {
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

    deviceFeature.last_value = historicalStateObject.value;
    deviceFeature.last_value_changed = historicalStateObject.created_at;

    // save local state in RAM
    this.stateManager.setState('deviceFeature', deviceFeature.selector, {
      last_value: historicalStateObject.value,
      last_value_changed: historicalStateObject.created_at,
    });
  }
}

module.exports = {
  saveHistoricalState,
};
