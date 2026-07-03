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

module.exports = {
  getFeaturesInclude,
  getStandardDeviceIncludes,
};
