const db = require('../../models');
const logger = require('../../utils/logger');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

/**
 * @description Save hstorical device feature state in DB.
 * @param {Object} device - A Device object.
 * @param {Object} deviceFeature - A DeviceFeature object.
 * @param {Object} historicalState - The historical feature state object of the deviceFeature to save.
 * @example
 * saveHistoricalState({
 *   id: 'fc235c88-b10d-4706-8b59-fef92a7119b2',
 *   selector: 'my-light'
 * }, {
 *   id: '14sd58f3-b10d-4706-8b59-dsdfdsfdsf',
 *   device_feature_id: '',
 *   value: 'newValue',
 *   created_at: '2020-03-03',
 *   updated_at: '2020-03-03',
 * });
 */
async function saveHistoricalState(device, deviceFeature, historicalState) {
  logger.debug(`device.saveHistoricalState of deviceFeature ${deviceFeature.selector}`, historicalState);

  // get current feture to update last value if needed
  const deviceFeatureInDB = await db.DeviceFeature.findOne({
    where: {
      id: deviceFeature.id,
    },
  });
  logger.debug(deviceFeature.id, deviceFeatureInDB);

  await db.DeviceFeatureState.create(historicalState);

  if (new Date(historicalState.created_at) > new Date(deviceFeatureInDB.last_value_changed)) {
    await db.DeviceFeature.update(
      {
        last_value_string: historicalState.value,
        last_value_changed: historicalState.created_at,
      },
      {
        where: {
          id: deviceFeature.id,
        },
      },
    );

    deviceFeature.last_value_string = historicalState.value;
    deviceFeature.last_value_changed = historicalState.updated_at;

    // save local state in RAM
    this.stateManager.setState('deviceFeature', deviceFeature.selector, deviceFeature);

    // send websocket event
    this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
      type: WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STRING_STATE,
      payload: {
        device: device.selector,
        last_value_string: historicalState.value,
        last_value_changed: historicalState.updated_at,
      },
    });
  }
}

module.exports = {
  saveHistoricalState,
};
