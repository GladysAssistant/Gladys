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
    [DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]: (value, { min, max }) => {
      return Math.round((value * 100) / max);
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
  [DIRECTIVE_NAMESPACES.BrightnessController]: (
    directiveName,
    payload,
    currentValue,
    binaryCurrentValue,
    { min, max },
  ) => {
    if (directiveName === 'AdjustBrightness') {
      // if the light is currently off
      if (binaryCurrentValue === 0) {
        // decreasing the brightness should keep the brightness at minimum value
        if (payload.brightnessDelta < min) {
          return min;
        }
        // putting more brightness should start from 0 (not previous value)
        return Math.round((payload.brightnessDelta * max) / 100);
      }
      // otherwise, if light is already on
      // we compare with previous value
      const newValue = currentValue + (payload.brightnessDelta * max) / 100;
      if (newValue > max) {
        return max;
      }
      if (newValue < min) {
        return min;
      }
      return newValue;
    }
    return Math.round((payload.brightness * max) / 100);
  },
  [DIRECTIVE_NAMESPACES.ColorController]: (hsbColor) => {
    const rgb = hsbToRgb([hsbColor.hue, hsbColor.saturation * 100, hsbColor.brightness * 100]);
    const int = rgbToInt(rgb);
    return int;
  },
};

module.exports = { mappings, readValues, writeValues };
