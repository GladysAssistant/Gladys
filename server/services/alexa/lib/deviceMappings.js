const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');

const mappings = {
  [DEVICE_FEATURE_CATEGORIES.LIGHT]: {
    category: 'LIGHT',
    capabilities: {
      [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: {
        type: 'AlexaInterface',
        interface: 'Alexa.PowerController',
        version: '3',
        properties: {
          supported: [
            {
              name: 'powerState',
            },
          ],
          proactivelyReported: true,
          retrievable: true,
        },
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    category: 'SMARTPLUG',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: {
        type: 'AlexaInterface',
        interface: 'Alexa.PowerController',
        version: '3',
        properties: {
          supported: [
            {
              name: 'powerState',
            },
          ],
          proactivelyReported: true,
          retrievable: true,
        },
      },
    },
  },
};

const readValues = {
  [DEVICE_FEATURE_CATEGORIES.LIGHT]: {
    [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: (value) => {
      return value === 1 ? 'ON' : 'OFF';
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: (value) => {
      return value === 1 ? 'ON' : 'OFF';
    },
  },
};

const writeValues = {
  'Alexa.PowerController': (directiveName) => {
    return directiveName === 'TurnOn' ? 1 : 0;
  },
};

module.exports = { mappings, readValues, writeValues };
