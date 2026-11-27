const db = require('../../models');

// The table has no index: bounded on both sides, like the aggregate queries, DuckDB only reads the row
// groups of the window instead of the whole history of the instance.
const LAST_STATE_IN_WINDOW_QUERY = `
  SELECT
    value
  FROM
    t_device_feature_state
  WHERE
    device_feature_id = ?
    AND created_at > ?
    AND created_at <= ?
  ORDER BY
    created_at DESC
  LIMIT 1;
`;

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

// How far back the value in force is looked for first. A feature whose last change is older is read
// from RAM when it has not changed since; the whole history is only read when it changed in the
// period after more than this without any change.
const LOOKBACK_MS = 7 * 24 * 60 * 60 * 1000;

// How long before the first recorded state the value in force is held. The chart box rounds every point
// to the second: a shorter offset would land on the same x as the change, and the step could be lost.
const HOLD_OFFSET_MS = 1000;

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
 * @description Tell whether the states of a feature are recorded. A feature that keeps no history has
 * nothing in the database, while its last value is still kept in RAM: carrying that value would draw a
 * line or a segment that comes and goes with the age of its last change.
 * @param {object} deviceFeature - The device feature.
 * @returns {boolean} False when the feature keeps no history.
 * @example
 * keepsHistory({ keep_history: false }); // false
 */
function keepsHistory(deviceFeature) {
  return deviceFeature.keep_history !== false;
}

/**
 * @description Tell whether an aggregated point draws the same value as the one in force on every
 * series of the chart: the average, and the min and max lines.
 * @param {object} point - An aggregated value.
 * @param {number} value - The value in force.
 * @returns {boolean} True when the average, the min and the max all equal the value.
 * @example
 * drawsOnlyValue({ value: 7, min_value: 0, max_value: 14 }, 7); // false
 */
function drawsOnlyValue(point, value) {
  return [point.value, point.min_value, point.max_value].every(
    (drawn) => drawn === undefined || drawn === null || drawn === value,
  );
}

/**
 * @description Get the value of a feature in force at a given time: the last state recorded at or before it.
 * When the feature has not changed since that time, it is the last value kept in RAM, without any query.
 * Otherwise the last week before that time is read first, and the whole history only when nothing was
 * recorded during it.
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
  const lookbackStart = new Date(dateForQuery.getTime() - LOOKBACK_MS);
  let rows = await db.duckDbReadConnectionAllAsync(
    LAST_STATE_IN_WINDOW_QUERY,
    deviceFeature.id,
    lookbackStart,
    dateForQuery,
  );
  if (rows.length === 0) {
    rows = await db.duckDbReadConnectionAllAsync(LAST_STATE_BEFORE_QUERY, deviceFeature.id, lookbackStart);
  }
  return rows.length > 0 ? rows[0].value : null;
}

/**
 * @description Show a value that is set and does not move (a setpoint, a mode): a value set before the
 * period is still in force during it, until someone changes it.
 * - At the start of the period, a point carries the value in force at that time. When the value changed
 *   during the period, a second point holds it until one second before the first recorded state: joined
 *   straight to that state, it would draw a ramp over hours on a line chart, not a step.
 * - At the end, the last state recorded (not the last bucket average) is carried until the end of the period.
 * Only a feature that is set (read_only false) and keeps its history is carried: a measure (read_only
 * true) is left as it is, as nothing tells whether it would still measure the same value.
 * The points added are flagged "carried_forward" and count no state.
 * @param {object} params - Parameters.
 * @param {object} params.deviceFeature - The device feature.
 * @param {Array} params.values - The aggregated values of the period, ordered by date.
 * @param {Date} params.startDate - Real start of the period.
 * @param {Date} params.endDate - Real end of the period.
 * @param {Date} params.startDateForQuery - Start of the period, shifted the way the aggregate queries expect it.
 * @param {Date} params.endDateForQuery - End of the period, shifted the way the aggregate queries expect it.
 * @returns {Promise<Array>} The values, with the carried forward points.
 * @example
 * await carryForwardAggregates({ deviceFeature, values, ...period });
 */
async function carryForwardAggregates({
  deviceFeature,
  values,
  startDate,
  endDate,
  startDateForQuery,
  endDateForQuery,
}) {
  if (deviceFeature.read_only !== false || !keepsHistory(deviceFeature)) {
    return values;
  }

  const result = [...values];

  const valueAtStart = await getValueInForceAt(deviceFeature, startDate, startDateForQuery);
  if (valueAtStart !== null) {
    const firstStateTime = values.length > 0 ? toTimestamp(values[0].created_at) : null;
    // Held flat up to the change, so that the line steps there — the min and max lines too, which can
    // move while the average does not.
    const holdTime = firstStateTime === null ? null : firstStateTime - HOLD_OFFSET_MS;
    if (holdTime !== null && holdTime > startDate.getTime() && !drawsOnlyValue(values[0], valueAtStart)) {
      result.unshift(buildCarriedForwardPoint(new Date(holdTime), valueAtStart));
    }
    result.unshift(buildCarriedForwardPoint(startDate, valueAtStart));
  }

  // No recorded state was ever found: nothing to carry.
  if (result.length === 0) {
    return values;
  }

  const lastPointTime = toTimestamp(result[result.length - 1].created_at);
  if (endDate.getTime() > lastPointTime) {
    // The last aggregated point is an average: carry the last state actually recorded instead.
    const valueAtEnd =
      values.length === 0 ? valueAtStart : await getValueInForceAt(deviceFeature, endDate, endDateForQuery);
    if (valueAtEnd !== null) {
      result.push(buildCarriedForwardPoint(endDate, valueAtEnd));
    }
  }

  return result;
}

/**
 * @description Show an on/off state that does not move in a timeline: the state set before the period
 * is still in force at its start. The first segment then starts at the start of the period: either the
 * first segment of the period is stretched back when it has the same state, or a segment with the state
 * in force is added before it. The end of the last segment is left as it is (open, the client carries it
 * until the end of the period). A feature that keeps no history is left as it is.
 * @param {object} params - Parameters.
 * @param {object} params.deviceFeature - The device feature.
 * @param {Array} params.values - The state changes of the period, ordered by date.
 * @param {Date} params.startDate - Real start of the period.
 * @param {Date} params.startDateForQuery - Start of the period, shifted the way the aggregate queries expect it.
 * @returns {Promise<Array>} The state changes, starting at the start of the period when a state was in force.
 * @example
 * await carryForwardBinaryStates({ deviceFeature, values, startDate, startDateForQuery });
 */
async function carryForwardBinaryStates({ deviceFeature, values, startDate, startDateForQuery }) {
  if (!keepsHistory(deviceFeature)) {
    return values;
  }
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
  // The query already applied its limit: every change it returned is kept, with one more segment at most.
  return [
    { value: valueAtStart, created_at: startDate, end_time: firstValue.created_at, carried_forward: true },
    ...values,
  ];
}

module.exports = {
  carryForwardAggregates,
  carryForwardBinaryStates,
};
