const { addSelector } = require('../../../../utils/addSelector');
const logger = require('../../../../utils/logger');

// Modules
const modules = require('./modules');

// Features
const power = require('./power');
const dimmer = require('./dimmer');
const energyCurrent = require('./energy.current');
const energyPower = require('./energy.power');
const energyVoltage = require('./energy.voltage');
const colorChannel = require('./colorChannel');
const colorScheme = require('./colorScheme');
const colorSpeed = require('./colorSpeed');
const colorTemperature = require('./colorTemperature');
const counter = require('./counter');
const humidity = require('./humidity');
const temperature = require('./temperature');

const FEATURE_TEMPLATES = [
  power,
  dimmer,
  energyCurrent,
  energyPower,
  energyVoltage,
  colorChannel,
  colorScheme,
  colorSpeed,
  colorTemperature,
  counter,
  humidity,
  temperature,
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

const addFeature = (device, featureTemplate, fullKey, command, value) => {
  const featureExternalId = generateExternalId(featureTemplate, command, fullKey);
  const externalId = `${device.external_id}:${featureExternalId}`;
  const existingFeature = device.features.find((f) => f.external_id === externalId);

  if (existingFeature) {
    logger.debug(`Tasmota: duplicated feature handled for ${externalId}`);
  } else {
    const generatedFeature = featureTemplate.generateFeature(device, command, value);

    if (generatedFeature) {
      const convertedValue = generateValue(featureTemplate, value);

      const feature = {
        ...generatedFeature,
        external_id: externalId,
        selector: externalId,
        last_value: convertedValue,
      };

      addSelector(feature);

      device.features.push(feature);
      return feature;
    }
  }

  return null;
};

module.exports = {
  MODULES: modules,
  FEATURE_TEMPLATES,
  recursiveSearch,
  addFeature,
  generateExternalId,
  generateValue,
};
