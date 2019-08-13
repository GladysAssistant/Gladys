const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../../../utils/constants');

const buildFeature = (category, type, min = 0, max = 1, unit = undefined) => {
  return {
    category,
    type,
    should_poll: false,
    min,
    max,
    unit,
  };
};

const featuresByModel = {
  'WSDCGQ11LM': [
    buildFeature(DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR, DEVICE_FEATURE_TYPES.SENSOR.DECIMAL, -20, 60, DEVICE_FEATURE_UNITS.CELSIUS),
    buildFeature(DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR, DEVICE_FEATURE_TYPES.SENSOR.DECIMAL, 0, 100, DEVICE_FEATURE_UNITS.PERCENT),
    buildFeature(DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR, DEVICE_FEATURE_TYPES.SENSOR.DECIMAL, 30, 110, DEVICE_FEATURE_UNITS.PRESSURE_KPA),
  ]
};

const getFeatures = (device) => {
  let features = featuresByModel[device.model] || [];
  features = features.map(f => {
    const feature = Object.assign({}, f);
    f.name = `${device.friendly_name} - ${f.category}`;
    f.external_id = `${device.ieeeAddr}:${f.category}`;
    return feature;
  });

  if (device.powerSource === 'Battery') {
    features.push(buildFeature(DEVICE_FEATURE_CATEGORIES.BATTERY, DEVICE_FEATURE_TYPES.SENSOR.INTEGER, 0, 100, DEVICE_FEATURE_UNITS.PERCENT));
  }

  return features;
};

module.exports = {
  getFeatures,
};