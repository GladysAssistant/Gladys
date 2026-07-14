const db = require('../../models');
const { BadParameters } = require('../../utils/coreErrors');

const DEFAULT_TAKE = 100;
const MAX_TAKE = 500;

const ONE_HOUR_IN_MS = 60 * 60 * 1000;
const ONE_DAY_IN_MS = 24 * ONE_HOUR_IN_MS;
// Progressively widening lower time bounds (relative to the window reference, see
// below) tried until a full page is collected. Without a lower bound, `ORDER BY
// created_at DESC LIMIT n` forces DuckDB to run a Top-N over every row that passes
// the filter (the whole table on the unfiltered "All" view), which is why the
// request took tens of seconds on large databases. Adding `created_at >= ?` lets
// DuckDB skip old row groups thanks to its per-row-group min/max metadata (zone maps): states are
// stored time-contiguously (live inserts are appended in order, and the SQLite ->
// DuckDB migration inserts each feature's history contiguously), so a recent window
// only has to scan the most recent row groups. The final `null` window removes the
// lower bound so older states are still returned when recent windows are sparse.
const PROGRESSIVE_WINDOWS_IN_MS = [
  ONE_HOUR_IN_MS,
  ONE_DAY_IN_MS,
  7 * ONE_DAY_IN_MS,
  30 * ONE_DAY_IN_MS,
  365 * ONE_DAY_IN_MS,
  null,
];

/**
 * @description Decorate raw DuckDB state rows with device/feature/room metadata.
 * @param {Array} rows - Raw rows (device_feature_id, value, created_at).
 * @param {Map} featuresById - Plain device features indexed by id.
 * @returns {Array} States with device/feature/room metadata, deleted features filtered out.
 * @example
 * const states = mapRowsToStates(rows, featuresById);
 */
const mapRowsToStates = (rows, featuresById) =>
  rows
    .filter((row) => featuresById.has(row.device_feature_id))
    .map((row) => {
      const feature = featuresById.get(row.device_feature_id);
      return {
        value: row.value,
        created_at: row.created_at,
        device_feature: {
          id: feature.id,
          name: feature.name,
          selector: feature.selector,
          category: feature.category,
          type: feature.type,
          unit: feature.unit,
        },
        device: {
          name: feature.device.name,
          selector: feature.device.selector,
        },
        room: feature.device.room
          ? {
              name: feature.device.room.name,
              selector: feature.device.room.selector,
            }
          : null,
      };
    });

/**
 * @description Get the history of device states across all devices, most recent first.
 * @param {object} [options] - Options of the query.
 * @param {string} [options.before] - Only return states created strictly before this date (pagination cursor).
 * @param {string} [options.before_id] - Device feature id of the last returned state, used as a tiebreaker
 * to paginate deterministically when several states share the same created_at.
 * @param {string} [options.since] - Only return states created at or after this date. When set, the query is
 * a single bounded probe: it returns what the [since, before) window contains, even fewer than `take`,
 * and never widens — the caller drives the progressive widening and can render partial results.
 * @param {number} [options.take] - Max number of states to return.
 * @param {string} [options.categories] - Comma-separated list of device feature categories to filter on.
 * @param {string} [options.room_id] - Only return states of devices in this room.
 * @param {string} [options.search] - Only return states of devices whose name matches this search.
 * @returns {Promise<Array>} - Resolve with an array of states with device/feature/room metadata.
 * @example
 * const history = await gladys.device.getDeviceStatesHistory({ take: 50, categories: 'opening-sensor' });
 */
async function getDeviceStatesHistory(options = {}) {
  const take = Math.min(Math.max(parseInt(options.take, 10) || DEFAULT_TAKE, 1), MAX_TAKE);
  const before = options.before ? new Date(options.before) : new Date();
  if (Number.isNaN(before.getTime())) {
    throw new BadParameters(`Invalid "before" date: ${options.before}`);
  }
  const beforeId = options.before_id || null;
  const since = options.since ? new Date(options.since) : null;
  if (since && Number.isNaN(since.getTime())) {
    throw new BadParameters(`Invalid "since" date: ${options.since}`);
  }

  const deviceFeatures = await db.DeviceFeature.findAll({
    attributes: ['id', 'name', 'selector', 'category', 'type', 'unit', 'last_value_changed'],
    include: [
      {
        model: db.Device,
        as: 'device',
        attributes: ['id', 'name', 'selector'],
        include: [
          {
            model: db.Room,
            as: 'room',
            attributes: ['id', 'name', 'selector'],
          },
        ],
      },
    ],
  });

  const featuresById = new Map();
  deviceFeatures.forEach((deviceFeature) => {
    featuresById.set(deviceFeature.id, deviceFeature.get({ plain: true }));
  });

  const categories = options.categories ? options.categories.split(',') : null;
  const search = options.search ? options.search.toLowerCase() : null;

  // Always constrain the query to the list of matching feature ids: it both
  // applies the filters and excludes states of deleted device features
  // (which would otherwise consume rows of the LIMIT).
  let maxLastValueChanged = null;
  const filteredFeatureIds = Array.from(featuresById.values())
    .filter((feature) => {
      if (categories && !categories.includes(feature.category)) {
        return false;
      }
      if (options.room_id && (!feature.device.room || feature.device.room.id !== options.room_id)) {
        return false;
      }
      if (search && !feature.device.name.toLowerCase().includes(search)) {
        return false;
      }
      return true;
    })
    .map((feature) => {
      if (feature.last_value_changed) {
        const lastValueChanged = new Date(feature.last_value_changed);
        if (!maxLastValueChanged || lastValueChanged > maxLastValueChanged) {
          maxLastValueChanged = lastValueChanged;
        }
      }
      return feature.id;
    });
  if (filteredFeatureIds.length === 0) {
    return [];
  }

  // Anchor progressive windows on the most recent activity among filtered features
  // instead of always starting from `before` (usually "now"). Stale devices that
  // have not reported since months ago would otherwise exhaust every narrow window
  // before the unbounded fallback query runs.
  const windowReference = maxLastValueChanged && maxLastValueChanged < before ? maxLastValueChanged : before;

  // Keyset pagination on the compound key (created_at, device_feature_id). Ordering
  // and filtering on both columns guarantees that states sharing the same created_at
  // are never skipped when a page boundary falls in the middle of that timestamp.
  const cursorParams = [];
  let cursorClause;
  if (beforeId) {
    cursorClause =
      '(created_at < CAST(? AS TIMESTAMPTZ) OR (created_at = CAST(? AS TIMESTAMPTZ) AND device_feature_id < CAST(? AS UUID)))';
    cursorParams.push(before.toISOString(), before.toISOString(), beforeId);
  } else {
    cursorClause = 'created_at < CAST(? AS TIMESTAMPTZ)';
    cursorParams.push(before.toISOString());
  }

  const featureIdPlaceholders = filteredFeatureIds.map(() => '?').join(',');

  if (since) {
    // Caller-driven bounded probe: a single [since, before) query returning what
    // the window contains, even below `take`, without widening. The caller
    // (Activity feed) probes windows newest-first and renders partial results
    // as they arrive, so no request ever has to pay an unbounded scan upfront.
    const queryParams = [since.toISOString(), ...cursorParams, ...filteredFeatureIds, take];
    const query = `
      SELECT device_feature_id, value, created_at
      FROM t_device_feature_state
      WHERE created_at >= CAST(? AS TIMESTAMPTZ) AND ${cursorClause}
      AND device_feature_id IN (${featureIdPlaceholders})
      ORDER BY created_at DESC, device_feature_id DESC
      LIMIT ?
    `;
    const rows = await db.duckDbReadConnectionAllAsync(query, ...queryParams);
    return mapRowsToStates(rows, featuresById);
  }

  // Query progressively wider time windows and stop as soon as we have a full page.
  // A recent window is answered almost instantly thanks to zone map pruning; the
  // wider windows (up to the unbounded one) only run when recent states are scarce.
  let rows = [];
  for (let i = 0; i < PROGRESSIVE_WINDOWS_IN_MS.length; i += 1) {
    const windowInMs = PROGRESSIVE_WINDOWS_IN_MS[i];
    const queryParams = [];
    let lowerBoundClause = '';
    if (windowInMs !== null) {
      lowerBoundClause = 'created_at >= CAST(? AS TIMESTAMPTZ) AND ';
      queryParams.push(new Date(windowReference.getTime() - windowInMs).toISOString());
    }
    queryParams.push(...cursorParams, ...filteredFeatureIds, take);

    const query = `
      SELECT device_feature_id, value, created_at
      FROM t_device_feature_state
      WHERE ${lowerBoundClause}${cursorClause}
      AND device_feature_id IN (${featureIdPlaceholders})
      ORDER BY created_at DESC, device_feature_id DESC
      LIMIT ?
    `;

    // eslint-disable-next-line no-await-in-loop
    rows = await db.duckDbReadConnectionAllAsync(query, ...queryParams);
    // A full page is, by construction, the most recent `take` states before the
    // cursor: any state inside the window is more recent than any state below it.
    if (rows.length >= take) {
      break;
    }
  }

  return mapRowsToStates(rows, featuresById);
}

module.exports = {
  getDeviceStatesHistory,
};
