const db = require('../../models');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

const GET_LAST_STATE_QUERY = `
  SELECT
      value,
      created_at
  FROM
      t_device_feature_state
  WHERE device_feature_id = CAST(? AS UUID)
  ORDER BY created_at DESC
  LIMIT 1
`;

/**
 * @description Recompute the last value of a device feature from its history, and
 * propagate it to the DB, the state manager and the websocket.
 * @param {object} deviceFeature - A DeviceFeature object (id & selector are required).
 * @returns {Promise<object>} - Resolve with the new last value of the device feature.
 * @example
 * await gladys.device.refreshFeatureLastValue({ id: 'uuid', selector: 'my-sensor' });
 */
async function refreshFeatureLastValue(deviceFeature) {
  // This query is not bounded in time on purpose: the previous state can be arbitrarily
  // old (a sensor that only reported the value being deleted). It is only ever run when
  // the state the user edited was the current value of the feature, which is a rare,
  // manual gesture, so paying a scan here is acceptable.
  const rows = await db.duckDbReadConnectionAllAsync(GET_LAST_STATE_QUERY, deviceFeature.id);

  const lastValue = rows.length > 0 ? rows[0].value : null;
  const lastValueChanged = rows.length > 0 ? new Date(rows[0].created_at) : null;

  await db.DeviceFeature.update(
    {
      last_value: lastValue,
      last_value_changed: lastValueChanged,
    },
    {
      where: {
        id: deviceFeature.id,
      },
    },
  );

  this.stateManager.setState('deviceFeature', deviceFeature.selector, {
    last_value: lastValue,
    last_value_changed: lastValueChanged,
  });

  this.eventManager.emit(EVENTS.WEBSOCKET.SEND_ALL, {
    type: WEBSOCKET_MESSAGE_TYPES.DEVICE.NEW_STATE,
    payload: {
      device_feature_selector: deviceFeature.selector,
      last_value: lastValue,
      last_value_changed: lastValueChanged,
    },
  });

  return {
    last_value: lastValue,
    last_value_changed: lastValueChanged,
  };
}

module.exports = {
  refreshFeatureLastValue,
};
