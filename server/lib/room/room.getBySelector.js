const db = require('../../models');
const { NotFoundError } = require('../../utils/coreErrors');

const DEFAULT_OPTIONS = {
  expand: [],
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
 * @description Get a room by selector
 * @param {string} selector - The selector of the room.
 * @param {Object} [options] - Options of the query.
 * @example
 * gladys.room.getBySelector('living-room');
 */
async function getBySelector(selector, options) {
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
  const room = await db.Room.findOne({
    include,
    where: {
      selector,
    },
  });

  if (room === null) {
    throw new NotFoundError('Room not found');
  }

  return room.get({ plain: true });
}

module.exports = {
  getBySelector,
};
