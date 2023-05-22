const { Op } = require('sequelize');
const db = require('../../models');
const { DEVICE_FEATURE_CATEGORIES } = require('../../utils/constants');

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
  'last_value_string',
  'last_value_changed',
];
const SERVICE_ATTRIBUTES = ['name'];

/**
 * @description Get a room by selector.
 * @param {string} selector - The selector of the room.
 * @param {object} [options] - Options of the query.
 * @returns {Promise<object>} Resolve with room.
 * @example
 * gladys.room.getBySelector('living-room');
 */
async function getBySelector(selector, options) {
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
          where: {
            category: {
              [Op.not]: DEVICE_FEATURE_CATEGORIES.CAMERA,
            },
          },
        },
        {
          model: db.Service,
          as: 'service',
          attributes: SERVICE_ATTRIBUTES,
        },
      ],
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
