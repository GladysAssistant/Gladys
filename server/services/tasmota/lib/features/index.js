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
];

const generateValue = (featureTemplate, value) => {
  return typeof featureTemplate.readValue === 'function' ? featureTemplate.readValue(value) : value;
};

const generateExternalId = (featureTemplate, command) => {
  return typeof featureTemplate.generateExternalId === 'function'
    ? featureTemplate.generateExternalId(command)
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
      callback(featureTemplate, subKey, currentObj);
    } else if (typeof currentObj === 'object') {
      recursiveSearch(currentObj, callback, fullKey);
    }
  });
};

module.exports = {
  MODULES: modules,
  FEATURE_TEMPLATES,
  recursiveSearch,
  generateExternalId,
  generateValue,
};
