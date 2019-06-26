const db = require('../../models');

const DEFAULT_OPTIONS = {
  expand: [],
  take: 20,
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

/**
 * @description Get all rooms
 * @param {Object} [options] - Options.
 * @example
 * const rooms = await room.get();
 */
async function get(options) {
  const optionsWithDefault = Object.assign({}, DEFAULT_OPTIONS, options);
  const include = [];
  if (optionsWithDefault.expand.includes('devices')) {
    include.push({
      model: db.Device,
      as: 'devices',
      attributes: DEVICE_ATTRIBUTES,
      include: {
        model: db.DeviceFeature,
        as: 'features',
        attributes: DEVICE_FEATURES_ATTRIBUTES,
      },
    });
  }
  const rooms = await db.Room.findAll({
    include,
    limit: optionsWithDefault.take,
    offset: optionsWithDefault.skip,
    order: [[optionsWithDefault.order_by, optionsWithDefault.order_dir]],
  });
  const roomsPlain = rooms.map((room) => room.get({ plain: true }));
  return roomsPlain;
}

module.exports = {
  get,
};
