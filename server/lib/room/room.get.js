const db = require('../../models');

const DEFAULT_OPTIONS = {
  expand: [],
  skip: 0,
  order_by: 'name',
  order_dir: 'asc',
};

const DEVICE_ATTRIBUTES = ['name', 'selector'];

const DEVICE_FEATURES_ATTRIBUTES = [
  'name',
  'selector',
  'category',
  'type',
  'read_only',
  'unit',
  'min',
  'max',
  'last_value',
  'last_value_changed',
];

const SERVICE_ATTRIBUTES = ['id', 'name'];

/**
 * @description Get all rooms.
 * @param {object} [options] - Options.
 * @returns {Promise<Array>} Resolve with list of rooms.
 * @example
 * const rooms = await room.get();
 */
async function get(options) {
  const optionsWithDefault = { ...DEFAULT_OPTIONS, ...options };
  const include = [];
  if (optionsWithDefault.expand.includes('devices')) {
    include.push({
      model: db.Device,
      as: 'devices',
      attributes: DEVICE_ATTRIBUTES,
      include: [
        {
          model: db.DeviceFeature,
          as: 'features',
          attributes: DEVICE_FEATURES_ATTRIBUTES,
        },
        {
          model: db.Service,
          as: 'service',
          attributes: SERVICE_ATTRIBUTES,
        },
      ],
    });
  }
  const queryParams = {
    include,
    offset: optionsWithDefault.skip,
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
  };

  if (optionsWithDefault.take !== undefined) {
    queryParams.limit = optionsWithDefault.take;
  }

  const rooms = await db.Room.findAll(queryParams);
  const roomsPlain = rooms.map((room) => room.get({ plain: true }));
  return roomsPlain;
}

module.exports = {
  get,
};
