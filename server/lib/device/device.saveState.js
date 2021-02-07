const db = require('../../models');
const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

const DEFAULT_OPTIONS = {
  skip: 0,
  order_dir: 'DESC',
  order_by: 'created_at',
};

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
  const optionsWithDefault = Object.assign({}, DEFAULT_OPTIONS);
  logger.debug(`device.saveState of deviceFeature ${deviceFeature.selector}`);
  const now = new Date();
  const previousDeviceFeature = this.stateManager.get('deviceFeature', deviceFeature.selector);
  const previousDeviceFeatureValue = previousDeviceFeature ? previousDeviceFeature.last_value : null;

  const previousDeviceFeatureLastValueChanged = previousDeviceFeature ? previousDeviceFeature.last_value_changed : null;

  const deviceFeaturesState = await db.DeviceFeatureState.findOne({
    attributes: ['device_feature_id', 'value', 'created_at'],
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
    where: {
      device_feature_id: deviceFeature.id,
    },
  });
  const previousDeviceFeatureStateLastValueChanged = deviceFeaturesState ? deviceFeaturesState.created_at : 0;

  // save local state in RAM
  this.stateManager.setState('deviceFeature', deviceFeature.selector, {
    last_value: newValue,
    last_value_changed: now,
  });
  // update deviceFeature lastValue in DB
  await db.DeviceFeature.update(
    {
      last_value: newValue,
      last_value_changed: now,
    },
    {
      where: {
        id: deviceFeature.id,
      },
    );
    // if the deviceFeature should keep history, we save a new deviceFeatureState
    if (deviceFeature.keep_history) {
      // if the previous created deviceFeatureState is different of deviceFeature
      // last value changed, we save a new deviceFeatureState of old state
      if (previousDeviceFeatureLastValueChanged - previousDeviceFeatureStateLastValueChanged > 0) {
        await db.DeviceFeatureState.create(
          {
            device_feature_id: deviceFeature.id,
            value: previousDeviceFeatureValue,
            created_at: previousDeviceFeatureLastValueChanged,
          },
          {
            transaction: t,
          },
        );
      }
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
  });

  // send websocket event
  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
    payload: {
      device_feature_selector: deviceFeature.selector,
      last_value: newValue,
      last_value_changed: now,
    },
  });

  // check if there is a trigger matching
  this.eventManager.emit(EVENTS.TRIGGERS.CHECK, {
    type: EVENTS.DEVICE.NEW_STATE,
    device_feature: deviceFeature.selector,
    previous_value: previousDeviceFeatureValue,
    last_value: newValue,
    last_value_changed: now,
  });
}

module.exports = {
  saveState,
};
