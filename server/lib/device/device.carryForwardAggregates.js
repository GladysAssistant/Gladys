const db = require('../../models');

const LAST_STATE_BEFORE_QUERY = `
  SELECT
    value
  FROM
    t_device_feature_state
  WHERE
    device_feature_id = ?
    AND created_at <= ?
  ORDER BY
    created_at DESC
  LIMIT 1;
`;

/**
 * @description Convert a date coming from the DB or the state manager into a timestamp.
 * @param {Date|string|null|undefined} date - The date.
 * @returns {number|null} The timestamp in milliseconds, or null when there is no valid date.
 * @example
 * toTimestamp('2026-11-18T10:00:00.000Z');
 */
function toTimestamp(date) {
  if (date === null || date === undefined) {
    return null;
  }
  const timestamp = new Date(date).getTime();
  return Number.isNaN(timestamp) ? null : timestamp;
}

/**
 * @description Build a point that is not a recorded state, but the value still in force at a given time.
 * It counts no state, so it never changes a sum or a count.
 * @param {Date} date - The time of the point.
 * @param {number} value - The value in force.
 * @returns {object} The point, in the same shape as an aggregated value.
 * @example
 * buildCarriedForwardPoint(new Date(), 7);
 */
function buildCarriedForwardPoint(date, value) {
  return {
    created_at: date,
    value,
    max_value: value,
    min_value: value,
    sum_value: 0,
    count_value: 0,
    carried_forward: true,
  };
}

/**
 * @description Get the value of a feature in force at a given time: the last state recorded at or before it.
 * When the feature has not changed since that time, it is the last value kept in RAM, without any query.
 * @param {object} deviceFeature - The device feature.
 * @param {Date} date - The real time.
 * @param {Date} dateForQuery - The same time, shifted the way the aggregate queries expect it.
 * @returns {Promise<number|null>} The value, or null when nothing was recorded before.
 * @example
 * await getValueInForceAt(deviceFeature, date, dateForQuery);
 */
async function getValueInForceAt(deviceFeature, date, dateForQuery) {
  const lastValueChanged = toTimestamp(deviceFeature.last_value_changed);
  if (
    lastValueChanged !== null &&
    lastValueChanged <= date.getTime() &&
    deviceFeature.last_value !== null &&
    deviceFeature.last_value !== undefined
  ) {
    return deviceFeature.last_value;
  }
  const rows = await db.duckDbReadConnectionAllAsync(LAST_STATE_BEFORE_QUERY, deviceFeature.id, dateForQuery);
  return rows.length > 0 ? rows[0].value : null;
}

/**
 * @description Get the last time a device sent anything: the most recent change among all its features.
 * @param {object} device - The device, with its features.
 * @param {object} deviceFeature - The feature displayed, used when the device has no features list.
 * @returns {number|null} The timestamp, or null when the device never sent anything.
 * @example
 * getDeviceLastActivity(device, deviceFeature);
 */
function getDeviceLastActivity(device, deviceFeature) {
  const features = device && Array.isArray(device.features) ? device.features : [deviceFeature];
  return features.reduce((lastActivity, feature) => {
    const lastValueChanged = toTimestamp(feature.last_value_changed);
    if (lastValueChanged === null) {
      return lastActivity;
    }
    return lastActivity === null ? lastValueChanged : Math.max(lastActivity, lastValueChanged);
  }, null);
}

/**
 * @description Show a value that does not move: a value set before the period is still in force during it.
 * - At the start of the period, a point carries the value in force at that time.
 * - At the end, the last value is carried until the end of the period for a feature that is set
 * (a setpoint, a mode: read_only false), which stays valid until someone changes it. For a measure
 * (read_only true), it is carried only until the last time the device sent anything, so a device that
 * is no longer connected does not look like it still measures the same value.
 * The points added are flagged "carried_forward" and count no state.
 * @param {object} params - Parameters.
 * @param {object} params.deviceFeature - The device feature.
 * @param {object} params.device - The device of this feature.
 * @param {Array} params.values - The aggregated values of the period, ordered by date.
 * @param {Date} params.startDate - Real start of the period.
 * @param {Date} params.endDate - Real end of the period.
 * @param {Date} params.startDateForQuery - Start of the period, shifted the way the aggregate queries expect it.
 * @param {Date} params.endDateForQuery - End of the period, shifted the way the aggregate queries expect it.
 * @returns {Promise<Array>} The values, with the carried forward points.
 * @example
 * await carryForwardAggregates({ deviceFeature, device, values, ...period });
 */
async function carryForwardAggregates({
  deviceFeature,
  device,
  values,
  startDate,
  endDate,
  startDateForQuery,
  endDateForQuery,
}) {
  let carryUntil = endDate.getTime();
  if (deviceFeature.read_only !== false) {
    const deviceLastActivity = getDeviceLastActivity(device, deviceFeature);
    if (deviceLastActivity === null) {
      return values;
    }
    carryUntil = Math.min(carryUntil, deviceLastActivity);
  }
  // A measure whose device was silent during the whole period has nothing to show.
  if (carryUntil <= startDate.getTime()) {
    return values;
  }

  const result = [...values];

  const valueAtStart = await getValueInForceAt(deviceFeature, startDate, startDateForQuery);
  if (valueAtStart !== null) {
    result.unshift(buildCarriedForwardPoint(startDate, valueAtStart));
  }

  // No recorded state was ever found: nothing to carry.
  if (result.length === 0) {
    return values;
  }

  const lastPointTime = toTimestamp(result[result.length - 1].created_at);
  if (carryUntil > lastPointTime) {
    // The last aggregated point is an average: carry the last state actually recorded instead.
    const valueAtEnd =
      values.length === 0 ? valueAtStart : await getValueInForceAt(deviceFeature, endDate, endDateForQuery);
    if (valueAtEnd !== null) {
      result.push(buildCarriedForwardPoint(new Date(carryUntil), valueAtEnd));
    }
  }

  return result;
}

/**
 * @description Show an on/off state that does not move in a timeline: the state set before the period
 * is still in force at its start. The first segment then starts at the start of the period: either the
 * first segment of the period is stretched back when it has the same state, or a segment with the state
 * in force is added before it. The end of the last segment is left as it is (open, the client carries it
 * until the end of the period).
 * @param {object} params - Parameters.
 * @param {object} params.deviceFeature - The device feature.
 * @param {Array} params.values - The state changes of the period, ordered by date.
 * @param {Date} params.startDate - Real start of the period.
 * @param {Date} params.startDateForQuery - Start of the period, shifted the way the aggregate queries expect it.
 * @param {number} params.maxStates - Maximum number of segments: like the query, the last ones are dropped beyond it.
 * @returns {Promise<Array>} The state changes, starting at the start of the period when a state was in force.
 * @example
 * await carryForwardBinaryStates({ deviceFeature, values, startDate, startDateForQuery, maxStates: 300 });
 */
async function carryForwardBinaryStates({ deviceFeature, values, startDate, startDateForQuery, maxStates }) {
  const valueAtStart = await getValueInForceAt(deviceFeature, startDate, startDateForQuery);
  if (valueAtStart === null) {
    return values;
  }
  if (values.length === 0) {
    return [{ value: valueAtStart, created_at: startDate, end_time: null, carried_forward: true }];
  }
  const [firstValue, ...otherValues] = values;
  if (firstValue.value === valueAtStart) {
    return [{ ...firstValue, created_at: startDate }, ...otherValues];
  }
  const result = [
    { value: valueAtStart, created_at: startDate, end_time: firstValue.created_at, carried_forward: true },
    ...values,
  ];
  return result.slice(0, maxStates);
}

module.exports = {
  carryForwardAggregates,
  carryForwardBinaryStates,
};
