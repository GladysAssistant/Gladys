const db = require('../../models');
const { EVENTS, WEBSOCKET_MESSAGE_TYPES } = require('../../utils/constants');

const ONE_HOUR_IN_MS = 60 * 60 * 1000;
const ONE_DAY_IN_MS = 24 * ONE_HOUR_IN_MS;
// Progressively widening lower bounds, for the same reason (and with the same values) as
// device.getDeviceStatesHistory: `ORDER BY created_at DESC LIMIT 1` without a lower bound
// forces DuckDB to run a Top-N over every state of the feature (there is no index on
// device_feature_id), which was measured in tens of seconds on large databases. A bounded
// window only has to scan the most recent row groups thanks to the per-row-group min/max
// metadata (zone maps). The final `null` window removes the lower bound, so a sensor that
// last reported a long time ago still finds its previous state.
const PROGRESSIVE_WINDOWS_IN_MS = [
  ONE_HOUR_IN_MS,
  ONE_DAY_IN_MS,
  7 * ONE_DAY_IN_MS,
  30 * ONE_DAY_IN_MS,
  365 * ONE_DAY_IN_MS,
  null,
];

/**
 * @description Find the most recent state of a device feature strictly before a date.
 * @param {string} deviceFeatureId - Id of the device feature.
 * @param {Date} before - Only consider states created strictly before this date.
 * @returns {Promise<object>} - Resolve with the previous state, or null when there is none.
 * @example
 * const previousState = await findPreviousState('ca91dfdf-55b2-4cf8-a58b-99c0fbf6f5e4', new Date());
 */
async function findPreviousState(deviceFeatureId, before) {
  let rows = [];
  for (let i = 0; i < PROGRESSIVE_WINDOWS_IN_MS.length; i += 1) {
    const windowInMs = PROGRESSIVE_WINDOWS_IN_MS[i];
    const queryParams = [deviceFeatureId, before.toISOString()];
    let lowerBoundClause = '';
    if (windowInMs !== null) {
      lowerBoundClause = 'AND created_at >= CAST(? AS TIMESTAMPTZ)';
      queryParams.push(new Date(before.getTime() - windowInMs).toISOString());
    }

    const query = `
      SELECT
          value,
          created_at
      FROM
          t_device_feature_state
      WHERE device_feature_id = CAST(? AS UUID)
      AND created_at < CAST(? AS TIMESTAMPTZ)
      ${lowerBoundClause}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    // eslint-disable-next-line no-await-in-loop
    rows = await db.duckDbReadConnectionAllAsync(query, ...queryParams);
    // The most recent state of a window is, by construction, the most recent state of
    // every wider window too: no need to keep widening once one was found.
    if (rows.length > 0) {
      break;
    }
  }

  return rows.length > 0 ? { value: rows[0].value, created_at: new Date(rows[0].created_at) } : null;
}

/**
 * @description Set the last value of a device feature, and propagate it to the DB, the
 * state manager and the websocket.
 * @param {object} deviceFeature - A DeviceFeature object (id & selector are required).
 * @param {object} options - Where the new last value comes from.
 * @param {object} [options.lastState] - The new last state ({ value, created_at }), when the caller already knows it.
 * @param {Date} [options.before] - Otherwise, take the most recent state strictly before this date.
 * @returns {Promise<object>} - Resolve with the new last value of the device feature.
 * @example
 * await gladys.device.refreshFeatureLastValue({ id: 'uuid', selector: 'my-sensor' }, { before: new Date() });
 */
async function refreshFeatureLastValue(deviceFeature, { lastState, before }) {
  const newLastState = lastState || (await findPreviousState(deviceFeature.id, before));

  const lastValue = newLastState ? newLastState.value : null;
  const lastValueChanged = newLastState ? new Date(newLastState.created_at) : null;

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
