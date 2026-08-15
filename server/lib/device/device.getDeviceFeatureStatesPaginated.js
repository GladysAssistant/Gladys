const db = require('../../models');
const { NotFoundError, BadParameters } = require('../../utils/coreErrors');

const DEFAULT_TAKE = 100;
const MAX_TAKE = 500;
const DEFAULT_RANGE_IN_MS = 7 * 24 * 60 * 60 * 1000;

const COUNT_STATES_QUERY = `
  SELECT COUNT(*) AS count
  FROM t_device_feature_state
  WHERE device_feature_id = CAST(? AS UUID)
  AND created_at >= CAST(? AS TIMESTAMPTZ)
  AND created_at <= CAST(? AS TIMESTAMPTZ)
`;

const GET_STATES_QUERY = `
  SELECT
      created_at,
      value
  FROM
      t_device_feature_state
  WHERE device_feature_id = CAST(? AS UUID)
  AND created_at >= CAST(? AS TIMESTAMPTZ)
  AND created_at <= CAST(? AS TIMESTAMPTZ)
  ORDER BY created_at DESC
  LIMIT ?
  OFFSET ?
`;

/**
 * @description Get one page of the raw recorded states of a device feature, most recent first.
 * @param {string} deviceFeatureSelector - The selector of the device feature.
 * @param {object} [options] - Options of the query.
 * @param {string} [options.from] - Only return states created at or after this date.
 * @param {string} [options.to] - Only return states created at or before this date.
 * @param {number} [options.take] - Max number of states to return.
 * @param {number} [options.skip] - Number of states to skip (pagination offset).
 * @returns {Promise<object>} - Resolve with the total number of states in the range and the page of states.
 * @example
 * await gladys.device.getDeviceFeatureStatesPaginated('my-sensor', { from: '2025-01-01T00:00:00.000Z' });
 */
async function getDeviceFeatureStatesPaginated(deviceFeatureSelector, options = {}) {
  const deviceFeature = await db.DeviceFeature.findOne({ where: { selector: deviceFeatureSelector } });
  if (!deviceFeature) {
    throw new NotFoundError('DeviceFeature not found');
  }

  const take = Math.min(Math.max(parseInt(options.take, 10) || DEFAULT_TAKE, 1), MAX_TAKE);
  const skip = Math.max(parseInt(options.skip, 10) || 0, 0);

  const to = options.to ? new Date(options.to) : new Date();
  if (Number.isNaN(to.getTime())) {
    throw new BadParameters(`Invalid "to" date: ${options.to}`);
  }
  // The query is always bounded in time: without a lower bound, DuckDB has to scan
  // every row group of the feature (there is no index on device_feature_id), while a
  // bounded window is pruned thanks to the per-row-group min/max metadata (zone maps).
  const from = options.from ? new Date(options.from) : new Date(to.getTime() - DEFAULT_RANGE_IN_MS);
  if (Number.isNaN(from.getTime())) {
    throw new BadParameters(`Invalid "from" date: ${options.from}`);
  }

  const [{ count }] = await db.duckDbReadConnectionAllAsync(
    COUNT_STATES_QUERY,
    deviceFeature.id,
    from.toISOString(),
    to.toISOString(),
  );

  const states = await db.duckDbReadConnectionAllAsync(
    GET_STATES_QUERY,
    deviceFeature.id,
    from.toISOString(),
    to.toISOString(),
    take,
    skip,
  );

  return {
    // DuckDB returns a BigInt for COUNT(*), which is not JSON serializable
    total: Number(count),
    take,
    skip,
    states,
  };
}

module.exports = {
  getDeviceFeatureStatesPaginated,
};
