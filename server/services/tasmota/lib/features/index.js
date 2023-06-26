const { addSelector } = require('../../../../utils/addSelector');
const logger = require('../../../../utils/logger');

// Modules
const modules = require('./modules');

// Features
const power = require('./power');
const dimmer = require('./dimmer');
const distance = require('./distance');
const energyCurrent = require('./energy.current');
const energyApparentPower = require('./energy.apparentPower');
const energyReactivePower = require('./energy.reactivePower');
const energyPower = require('./energy.power');
const energyVoltage = require('./energy.voltage');
const energyTotal = require('./energy.total');
const energyToday = require('./energy.today');
const energyYesterday = require('./energy.yesterday');
const colorChannel = require('./colorChannel');
const colorScheme = require('./colorScheme');
const colorSpeed = require('./colorSpeed');
const colorTemperature = require('./colorTemperature');
const counter = require('./counter');
const humidity = require('./humidity');
const temperature = require('./temperature');
const deviceTemperature = require('./device_temperature');

const FEATURE_TEMPLATES = [
  power,
  dimmer,
  distance,
  energyCurrent,
  energyApparentPower,
  energyReactivePower,
  energyPower,
  energyVoltage,
  energyToday,
  energyYesterday,
  energyTotal,
  colorChannel,
  colorScheme,
  colorSpeed,
  colorTemperature,
  counter,
  humidity,
  temperature,
  deviceTemperature,
];

const generateValue = (featureTemplate, value) => {
  return typeof featureTemplate.readValue === 'function' ? featureTemplate.readValue(value) : value;
};

const generateExternalId = (featureTemplate, command, fullKey) => {
  return typeof featureTemplate.generateExternalId === 'function'
    ? featureTemplate.generateExternalId(command, fullKey)
    : command;
};

const recursiveSearch = (message, callback, key = undefined) => {
  Object.keys(message).forEach((subKey) => {
    const currentObj = message[subKey];
    const fullKey = `${key ? `${key}.` : ''}${subKey}`;

    const featureTemplate = FEATURE_TEMPLATES.find((template) => {
      return template.keyMatcher.test(fullKey);
    });

    if (featureTemplate) {
      callback(featureTemplate, fullKey, subKey, currentObj);
    } else if (typeof currentObj === 'object') {
      recursiveSearch(currentObj, callback, fullKey);
    }
  });
};

const generateFeature = (device, externalId, featureTemplate, fullKey, command, value, index = 0) => {
  const generatedFeature = featureTemplate.generateFeature(device, command, value, fullKey);

  if (generatedFeature) {
    const convertedValue = generateValue(featureTemplate, value);

    const feature = {
      ...generatedFeature,
      external_id: externalId,
      selector: externalId,
      last_value: convertedValue,
    };

    if (index > 0) {
      feature.name = `${feature.name} ${index}`;
      feature.external_id = `${feature.external_id}${index}`;
      feature.selector = `${feature.selector}${index}`;
    }

    addSelector(feature);

    device.features.push(feature);

    return feature;
  }

  return null;
};

const addFeature = (device, featureTemplate, fullKey, command, value) => {
  const featureExternalId = generateExternalId(featureTemplate, command, fullKey);
  const externalId = `${device.external_id}:${featureExternalId}`;
  const existingFeature = device.features.find((f) => f.external_id === externalId);

  const features = [];
  if (existingFeature) {
    logger.debug(`Tasmota: duplicated feature handled for ${externalId}`);
  } else {
    // Check if value is an array
    const arrayValue = typeof value === 'object';

    // If value is array, and feature should be splited
    const multipleFeatures = arrayValue && !featureTemplate.valueAsArray;

    const valueAsArray = multipleFeatures ? value : [value];

    valueAsArray.forEach((val, index) => {
      const displayIndex = multipleFeatures ? index + 1 : index;
      const feature = generateFeature(device, externalId, featureTemplate, fullKey, command, val, displayIndex);
      if (feature) {
        features.push(feature);
      }
    });
  }

  return features;
};

module.exports = {
  MODULES: modules,
  FEATURE_TEMPLATES,
  recursiveSearch,
  addFeature,
  generateExternalId,
  generateValue,
};
