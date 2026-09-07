const db = require('../models');

const SUPPORTED_OPTIONS_INCLUDE = {
  model: db.DeviceFeatureSupportedOption,
  as: 'supported_options',
};

/**
 * @description Get Sequelize include for device features with supported options.
 * @param {object} [options] - Optional include options.
 * @param {object} [options.where] - Where clause for features.
 * @param {Array<string>} [options.attributes] - Attributes to select for features.
 * @returns {object} Sequelize include object.
 * @example
 * getFeaturesInclude({ where: { category: 'light' } });
 */
function getFeaturesInclude(options = {}) {
  const include = {
    model: db.DeviceFeature,
    as: 'features',
    include: [SUPPORTED_OPTIONS_INCLUDE],
  };

  if (options.where) {
    include.where = options.where;
  }

  if (options.attributes) {
    include.attributes = options.attributes;
  }

  return include;
}

/**
 * @description Get standard Sequelize includes for loading a device.
 * @param {object} [featuresOptions] - Options passed to getFeaturesInclude.
 * @returns {Array} Sequelize include array.
 * @example
 * getStandardDeviceIncludes();
 */
function getStandardDeviceIncludes(featuresOptions = {}) {
  return [
    getFeaturesInclude(featuresOptions),
    {
      model: db.DeviceParam,
      as: 'params',
    },
    {
      model: db.Room,
      as: 'room',
    },
    {
      model: db.Service,
      as: 'service',
    },
  ];
}

// the feature columns the room endpoints serve to the frontend. Shared on
// purpose: room.get and room.getBySelector each kept their own copy and the
// two had already drifted (only one served last_value_string), so every new
// column had to be remembered twice or one endpoint silently served features
// without it.
const ROOM_DEVICE_FEATURES_ATTRIBUTES = [
  'name',
  'selector',
  'category',
  'type',
  'read_only',
  'unit',
  'min',
  'max',
  'step',
  'last_value',
  'last_value_string',
  'last_value_changed',
];

module.exports = {
  getFeaturesInclude,
  getStandardDeviceIncludes,
  ROOM_DEVICE_FEATURES_ATTRIBUTES,
};
