const db = require('../../models');

const ONE_HOUR_IN_MS = 60 * 60 * 1000;
const ONE_DAY_IN_MS = 24 * ONE_HOUR_IN_MS;

// Progressively widening lower time bounds, tried until every requested feature has an
// answer. Same reasoning as in device.getDeviceStatesHistory: `t_device_feature_state`
// holds the states of every feature interleaved in time order, so a query filtered only
// on `device_feature_id` has to scan the whole table. Adding `created_at >= ?` lets
// DuckDB skip old row groups thanks to its per-row-group min/max metadata (zone maps),
// so the common case (a door opened today) is answered by the first, cheapest window.
// The final `null` window removes the lower bound, so a sensor that has not changed for
// years is still resolved correctly, just at a higher cost.
const PROGRESSIVE_WINDOWS_IN_MS = [
  ONE_HOUR_IN_MS,
  ONE_DAY_IN_MS,
  7 * ONE_DAY_IN_MS,
  30 * ONE_DAY_IN_MS,
  365 * ONE_DAY_IN_MS,
  null,
];

/**
 * @description Keep, among the given features, only those whose history holds at least two
 * distinct values.
 *
 * A feature whose value never changed matches nothing in any bounded window, so it goes through
 * every one of them and then through the unbounded one: without this filter, every sensor that has
 * never flipped (a smoke or leak sensor reporting 0 for years, a door that has only ever been
 * closed) would run a `LAG` over a year of heartbeats, then over its whole history, on each
 * dashboard load. Those window functions have to sort the whole partition, while `MIN`/`MAX` only
 * stream over it — and `duckDbReadConnectionAllAsync` is serialized on a single read queue shared
 * with the charts, the history page and the aggregates.
 * @param {Array} featureIds - The ids of the device features to look at.
 * @returns {Promise<Array>} Resolve with the ids of the features whose value changed at least once.
 * @example
 * const changedFeatureIds = await keepFeaturesWhoseValueChanged([featureId]);
 */
async function keepFeaturesWhoseValueChanged(featureIds) {
  const featureIdPlaceholders = featureIds.map(() => '?').join(',');
  const rows = await db.duckDbReadConnectionAllAsync(
    `
      SELECT device_feature_id
      FROM t_device_feature_state
      WHERE device_feature_id IN (${featureIdPlaceholders})
      GROUP BY device_feature_id
      HAVING MIN(value) != MAX(value)
    `,
    ...featureIds,
  );
  return rows.map((row) => row.device_feature_id);
}

/**
 * @description Get the date at which the value of each given device feature last changed.
 *
 * `device_feature.last_value_changed` cannot be used for this: it is refreshed on every
 * state report, even when the device re-publishes the value it already had. The only
 * source of truth for a real value change is the state history, where a change is a state
 * whose value differs from the value of the state right before it.
 * @param {Array} deviceFeatureSelectors - The selectors of the device features to look at.
 * @returns {Promise<object>} Resolve with an object mapping each known selector to the date
 * of its last value change (or `null` when no change is found in the history).
 * @example
 * const lastStateChanges = await gladys.device.getLastStateChanges(['front-door-opening-sensor']);
 */
async function getLastStateChanges(deviceFeatureSelectors) {
  const lastStateChanges = {};
  const selectorByFeatureId = new Map();
  let mostRecentActivity = null;

  deviceFeatureSelectors.forEach((selector) => {
    const deviceFeature = this.stateManager.get('deviceFeature', selector);
    // An unknown feature, or a feature which does not keep any history, has no known
    // last state change: it is simply left out of the response.
    if (deviceFeature === null || !deviceFeature.keep_history) {
      return;
    }
    lastStateChanges[selector] = null;
    selectorByFeatureId.set(deviceFeature.id, selector);
    if (deviceFeature.last_value_changed) {
      const lastValueChanged = new Date(deviceFeature.last_value_changed);
      if (mostRecentActivity === null || lastValueChanged > mostRecentActivity) {
        mostRecentActivity = lastValueChanged;
      }
    }
  });

  if (selectorByFeatureId.size === 0) {
    return lastStateChanges;
  }

  // Anchor the windows on the most recent activity among the requested features instead of
  // always on "now": devices that stopped reporting a long time ago would otherwise burn
  // every narrow window before reaching the unbounded one.
  const now = new Date();
  const windowReference = mostRecentActivity !== null && mostRecentActivity < now ? mostRecentActivity : now;

  let remainingFeatureIds = Array.from(selectorByFeatureId.keys());
  let neverChangedFeaturesRemoved = false;

  for (let i = 0; i < PROGRESSIVE_WINDOWS_IN_MS.length && remainingFeatureIds.length > 0; i += 1) {
    const windowInMs = PROGRESSIVE_WINDOWS_IN_MS[i];
    // A feature left without an answer by the narrowest window is a quiet one, and quiet features
    // are mostly sensors which never flipped at all. Answering them here, with a single aggregate,
    // keeps them out of every wider window: waiting for the unbounded one would make each of them
    // run a `LAG` over up to a year of heartbeats first. The common case (a door opened in the last
    // hour) is answered by the first window and never pays for this query.
    if (!neverChangedFeaturesRemoved && (i > 0 || windowInMs === null)) {
      // eslint-disable-next-line no-await-in-loop
      remainingFeatureIds = await keepFeaturesWhoseValueChanged(remainingFeatureIds);
      neverChangedFeaturesRemoved = true;
      if (remainingFeatureIds.length === 0) {
        break;
      }
    }
    const featureIdPlaceholders = remainingFeatureIds.map(() => '?').join(',');
    const queryParams = [...remainingFeatureIds];
    let lowerBoundClause = '';
    if (windowInMs !== null) {
      lowerBoundClause = 'AND created_at >= CAST(? AS TIMESTAMPTZ)';
      queryParams.push(new Date(windowReference.getTime() - windowInMs).toISOString());
    }

    const query = `
      SELECT device_feature_id, MAX(created_at) AS last_state_changed_at
      FROM (
        SELECT
            device_feature_id,
            created_at,
            value,
            LAG(value) OVER (PARTITION BY device_feature_id ORDER BY created_at) AS previous_value
        FROM t_device_feature_state
        WHERE device_feature_id IN (${featureIdPlaceholders}) ${lowerBoundClause}
      )
      WHERE previous_value IS NOT NULL AND value != previous_value
      GROUP BY device_feature_id
    `;

    // eslint-disable-next-line no-await-in-loop
    const rows = await db.duckDbReadConnectionAllAsync(query, ...queryParams);
    rows.forEach((row) => {
      lastStateChanges[selectorByFeatureId.get(row.device_feature_id)] = row.last_state_changed_at;
    });
    // A window is the most recent time range searched so far, so a change found in it is
    // necessarily the latest one: only the features still without an answer are widened.
    remainingFeatureIds = remainingFeatureIds.filter(
      (featureId) => lastStateChanges[selectorByFeatureId.get(featureId)] === null,
    );
  }

  return lastStateChanges;
}

module.exports = {
  getLastStateChanges,
};
