const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../utils/constants');
const { DIRECTIVE_NAMESPACES } = require('./alexa.constants');
const { hsbToRgb, rgbToInt, intToRgb, rgbToHsb } = require('../../../utils/colors');

const mappings = {
  [DEVICE_FEATURE_CATEGORIES.LIGHT]: {
    category: 'LIGHT',
    capabilities: {
      [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: {
        type: 'AlexaInterface',
        interface: DIRECTIVE_NAMESPACES.PowerController,
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
        interface: DIRECTIVE_NAMESPACES.BrightnessController,
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
        interface: DIRECTIVE_NAMESPACES.ColorController,
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
        interface: DIRECTIVE_NAMESPACES.PowerController,
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
  [DIRECTIVE_NAMESPACES.PowerController]: (directiveName) => {
    return directiveName === 'TurnOn' ? 1 : 0;
  },
  [DIRECTIVE_NAMESPACES.BrightnessController]: (directiveName, payload, currentValue, binaryCurrentValue) => {
    if (directiveName === 'AdjustBrightness') {
      // if the light is currently off
      if (binaryCurrentValue === 0) {
        // decreasing the brightness should keep the brightness at 0
        if (payload.brightnessDelta < 0) {
          return 0;
        }
        // putting more brightness should start from 0 (not previous value)
        return payload.brightnessDelta;
      }
      // otherwise, if light is already on
      // we compare with previous value
      const newValue = currentValue + payload.brightnessDelta;
      if (newValue > 100) {
        return 100;
      }
      if (newValue < 0) {
        return 0;
      }
      return newValue;
    }
    return payload.brightness;
  },
  [DIRECTIVE_NAMESPACES.ColorController]: (hsbColor) => {
    const rgb = hsbToRgb([hsbColor.hue, hsbColor.saturation * 100, hsbColor.brightness * 100]);
    const int = rgbToInt(rgb);
    return int;
  },
};

module.exports = { mappings, readValues, writeValues };
