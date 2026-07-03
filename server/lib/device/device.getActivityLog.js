const { Op } = require('sequelize');
const db = require('../../models');
const { DEVICE_FEATURE_CATEGORIES } = require('../../utils/constants');

const ACTIVITY_LOG_DEFAULT_CATEGORIES = [
  DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR,
  DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR,
  DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR,
  DEVICE_FEATURE_CATEGORIES.LOCK,
  DEVICE_FEATURE_CATEGORIES.SHUTTER,
  DEVICE_FEATURE_CATEGORIES.CURTAIN,
  DEVICE_FEATURE_CATEGORIES.LIGHT,
  DEVICE_FEATURE_CATEGORIES.SWITCH,
  DEVICE_FEATURE_CATEGORIES.BUTTON,
  DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
  DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR,
  DEVICE_FEATURE_CATEGORIES.SIREN,
  DEVICE_FEATURE_CATEGORIES.TAMPER,
  DEVICE_FEATURE_CATEGORIES.BATTERY_LOW,
  DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR,
  DEVICE_FEATURE_CATEGORIES.RAIN_SENSOR,
  DEVICE_FEATURE_CATEGORIES.HEATER,
  DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
  DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING,
  DEVICE_FEATURE_CATEGORIES.FAN,
  DEVICE_FEATURE_CATEGORIES.TELEVISION,
  DEVICE_FEATURE_CATEGORIES.VACUUM_CLEANER,
  DEVICE_FEATURE_CATEGORIES.CO_SENSOR,
  DEVICE_FEATURE_CATEGORIES.CUBE,
  DEVICE_FEATURE_CATEGORIES.INPUT,
  DEVICE_FEATURE_CATEGORIES.CHILD_LOCK,
];

const DEFAULT_OPTIONS = {
  take: 30,
  skip: 0,
};

const GET_ACTIVITY_LOG_QUERY = `
  SELECT device_feature_id, value, created_at
  FROM t_device_feature_state
  WHERE device_feature_id IN ({feature_ids})
  AND created_at >= CAST(? AS TIMESTAMPTZ)
  AND created_at <= CAST(? AS TIMESTAMPTZ)
  ORDER BY created_at DESC
  LIMIT ? OFFSET ?
`;

/**
 * @description Get activity log entries across device features.
 * @param {object} [options] - Options of the query.
 * @param {string} [options.from] - Start date (ISO string).
 * @param {string} [options.to] - End date (ISO string).
 * @param {number} [options.take] - Number of entries to return.
 * @param {number} [options.skip] - Number of entries to skip.
 * @param {string} [options.categories] - Comma-separated list of feature categories.
 * @param {string} [options.room_selector] - Room selector to filter by.
 * @param {string} [options.mode] - 'events' (default) filters to activity-relevant categories, 'all' shows everything.
 * @returns {Promise<Array>} Resolve with list of activity log entries.
 * @example
 * const entries = await gladys.device.getActivityLog({ take: 30, skip: 0 });
 */
async function getActivityLog(options = {}) {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const take = parseInt(opts.take, 10);
  const skip = parseInt(opts.skip, 10);

  const endAt = opts.to ? new Date(opts.to) : new Date();
  const startAt = opts.from ? new Date(opts.from) : new Date(endAt.getTime() - 24 * 60 * 60 * 1000);

  const featureWhere = { keep_history: true };

  if (opts.categories) {
    featureWhere.category = { [Op.in]: opts.categories.split(',') };
  } else if (opts.mode !== 'all') {
    featureWhere.category = { [Op.in]: ACTIVITY_LOG_DEFAULT_CATEGORIES };
  }

  const deviceInclude = {
    model: db.Device,
    as: 'device',
    attributes: ['id', 'selector', 'name', 'room_id'],
    required: true,
    include: [
      {
        model: db.Room,
        as: 'room',
        attributes: ['id', 'selector', 'name'],
      },
      {
        model: db.Service,
        as: 'service',
        attributes: ['name'],
      },
    ],
  };

  if (opts.room_selector) {
    const room = await db.Room.findOne({ where: { selector: opts.room_selector } });
    if (!room) {
      return [];
    }
    deviceInclude.where = { room_id: room.id };
  }

  const features = await db.DeviceFeature.findAll({
    attributes: ['id', 'selector', 'name', 'category', 'type', 'unit'],
    where: featureWhere,
    include: [deviceInclude],
  });

  if (features.length === 0) {
    return [];
  }

  const featureMap = {};
  const featureIds = features.map((feature) => {
    featureMap[feature.id] = feature.get({ plain: true });
    return feature.id;
  });

  const featureIdsPlaceholder = featureIds.map(() => '?').join(',');
  const query = GET_ACTIVITY_LOG_QUERY.replace('{feature_ids}', featureIdsPlaceholder);

  const states = await db.duckDbReadConnectionAllAsync(
    query,
    ...featureIds,
    startAt.toISOString(),
    endAt.toISOString(),
    take,
    skip,
  );

  return states.map((state) => {
    const feature = featureMap[state.device_feature_id];
    const { device } = feature;

    return {
      created_at: state.created_at,
      value: state.value,
      device_feature_selector: feature.selector,
      device_feature_name: feature.name,
      device_feature_category: feature.category,
      device_feature_type: feature.type,
      device_feature_unit: feature.unit,
      device_selector: device.selector,
      device_name: device.name,
      room_name: device.room ? device.room.name : null,
      room_selector: device.room ? device.room.selector : null,
      service_name: device.service ? device.service.name : null,
    };
  });
}

module.exports = {
  getActivityLog,
  ACTIVITY_LOG_DEFAULT_CATEGORIES,
};
