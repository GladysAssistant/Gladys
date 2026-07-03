const db = require('../../models');
const { BadParameters } = require('../../utils/coreErrors');

const DEFAULT_TAKE = 100;
const MAX_TAKE = 500;

/**
 * @description Get the history of device states across all devices, most recent first.
 * @param {object} [options] - Options of the query.
 * @param {string} [options.before] - Only return states created strictly before this date (pagination cursor).
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

  const deviceFeatures = await db.DeviceFeature.findAll({
    attributes: ['id', 'name', 'selector', 'category', 'type', 'unit'],
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
    .map((feature) => feature.id);
  if (filteredFeatureIds.length === 0) {
    return [];
  }

  const query = `
    SELECT device_feature_id, value, created_at
    FROM t_device_feature_state
    WHERE created_at < CAST(? AS TIMESTAMPTZ)
    AND device_feature_id IN (${filteredFeatureIds.map(() => '?').join(',')})
    ORDER BY created_at DESC
    LIMIT ?
  `;
  const queryParams = [before.toISOString(), ...filteredFeatureIds, take];

  const rows = await db.duckDbReadConnectionAllAsync(query, ...queryParams);

  return rows
    .filter((row) => featuresById.has(row.device_feature_id))
    .map((row) => {
      const feature = featuresById.get(row.device_feature_id);
      return {
        value: row.value,
        created_at: row.created_at,
        device_feature: {
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
}

module.exports = {
  getDeviceStatesHistory,
};
