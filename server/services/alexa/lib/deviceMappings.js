const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { hsbToRgb, rgbToInt, intToRgb, rgbToHsb } = require('../../../utils/colors');

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
      [DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]: {
        type: 'AlexaInterface',
        interface: 'Alexa.BrightnessController',
        version: '3',
        properties: {
          supported: [
            {
              name: 'brightness',
            },
          ],
          proactivelyReported: true,
          retrievable: true,
        },
      },
      [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: {
        type: 'AlexaInterface',
        interface: 'Alexa.ColorController',
        version: '3',
        properties: {
          supported: [
            {
              name: 'color',
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
    [DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]: (value) => {
      return value;
    },
    [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: (intColor) => {
      const rgb = intToRgb(intColor);
      const hsb = rgbToHsb(rgb);
      return {
        hue: hsb[0],
        saturation: hsb[1] / 100,
        brightness: hsb[2] / 100,
      };
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
  'Alexa.BrightnessController': (directiveName, payload, currentValue) => {
    if (directiveName === 'AdjustBrightness') {
      return currentValue + payload.brightnessDelta;
    }
    return payload.brightness;
  },
  'Alexa.ColorController': (hsbColor) => {
    const rgb = hsbToRgb([hsbColor.hue, hsbColor.saturation * 100, hsbColor.brightness * 100]);
    const int = rgbToInt(rgb);
    return int;
  },
};

module.exports = { mappings, readValues, writeValues };
