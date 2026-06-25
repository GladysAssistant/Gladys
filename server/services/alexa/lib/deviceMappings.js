const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, COVER_STATE } = require('../../../utils/constants');
const {
  DIRECTIVE_NAMESPACES,
  BLIND_MODE_CONTROLLER_INSTANCE,
  BLIND_RANGE_CONTROLLER_INSTANCE,
  BLIND_MODES,
} = require('./alexa.constants');
const { hsbToRgb, rgbToInt, intToRgb, rgbToHsb } = require('../../../utils/colors');

const blindModeControllerCapability = {
  type: 'AlexaInterface',
  interface: DIRECTIVE_NAMESPACES.ModeController,
  instance: BLIND_MODE_CONTROLLER_INSTANCE,
  version: '3',
  properties: {
    supported: [
      {
        name: 'mode',
      },
    ],
    proactivelyReported: true,
    retrievable: true,
  },
  capabilityResources: {
    friendlyNames: [
      {
        '@type': 'asset',
        value: {
          assetId: 'Alexa.Setting.Opening',
        },
      },
    ],
  },
  configuration: {
    ordered: false,
    supportedModes: [
      {
        value: BLIND_MODES.UP,
        modeResources: {
          friendlyNames: [
            {
              '@type': 'asset',
              value: {
                assetId: 'Alexa.Value.Open',
              },
            },
          ],
        },
      },
      {
        value: BLIND_MODES.DOWN,
        modeResources: {
          friendlyNames: [
            {
              '@type': 'asset',
              value: {
                assetId: 'Alexa.Value.Close',
              },
            },
          ],
        },
      },
    ],
  },
  semantics: {
    actionMappings: [
      {
        '@type': 'ActionsToDirective',
        actions: ['Alexa.Actions.Close', 'Alexa.Actions.Lower'],
        directive: {
          name: 'SetMode',
          payload: {
            mode: BLIND_MODES.DOWN,
          },
        },
      },
      {
        '@type': 'ActionsToDirective',
        actions: ['Alexa.Actions.Open', 'Alexa.Actions.Raise'],
        directive: {
          name: 'SetMode',
          payload: {
            mode: BLIND_MODES.UP,
          },
        },
      },
    ],
    stateMappings: [
      {
        '@type': 'StatesToValue',
        states: ['Alexa.States.Closed'],
        value: BLIND_MODES.DOWN,
      },
      {
        '@type': 'StatesToValue',
        states: ['Alexa.States.Open'],
        value: BLIND_MODES.UP,
      },
    ],
  },
};

const blindRangeControllerCapability = {
  type: 'AlexaInterface',
  interface: DIRECTIVE_NAMESPACES.RangeController,
  instance: BLIND_RANGE_CONTROLLER_INSTANCE,
  version: '3',
  properties: {
    supported: [
      {
        name: 'rangeValue',
      },
    ],
    proactivelyReported: true,
    retrievable: true,
  },
  capabilityResources: {
    friendlyNames: [
      {
        '@type': 'asset',
        value: {
          assetId: 'Alexa.Setting.Opening',
        },
      },
    ],
  },
  configuration: {
    supportedRange: {
      minimumValue: 0,
      maximumValue: 100,
      precision: 1,
    },
    unitOfMeasure: 'Alexa.Unit.Percent',
  },
  semantics: {
    actionMappings: [
      {
        '@type': 'ActionsToDirective',
        actions: ['Alexa.Actions.Close'],
        directive: {
          name: 'SetRangeValue',
          payload: {
            rangeValue: 0,
          },
        },
      },
      {
        '@type': 'ActionsToDirective',
        actions: ['Alexa.Actions.Open'],
        directive: {
          name: 'SetRangeValue',
          payload: {
            rangeValue: 100,
          },
        },
      },
      {
        '@type': 'ActionsToDirective',
        actions: ['Alexa.Actions.Lower'],
        directive: {
          name: 'AdjustRangeValue',
          payload: {
            rangeValueDelta: -10,
            rangeValueDeltaDefault: false,
          },
        },
      },
      {
        '@type': 'ActionsToDirective',
        actions: ['Alexa.Actions.Raise'],
        directive: {
          name: 'AdjustRangeValue',
          payload: {
            rangeValueDelta: 10,
            rangeValueDeltaDefault: false,
          },
        },
      },
    ],
    stateMappings: [
      {
        '@type': 'StatesToValue',
        states: ['Alexa.States.Closed'],
        value: 0,
      },
      {
        '@type': 'StatesToRange',
        states: ['Alexa.States.Open'],
        range: {
          minimumValue: 1,
          maximumValue: 100,
        },
      },
    ],
  },
};

const coverCategoryMapping = {
  category: 'INTERIOR_BLIND',
  capabilities: {
    [DEVICE_FEATURE_TYPES.SHUTTER.STATE]: blindModeControllerCapability,
    [DEVICE_FEATURE_TYPES.SHUTTER.POSITION]: blindRangeControllerCapability,
    [DEVICE_FEATURE_TYPES.CURTAIN.STATE]: blindModeControllerCapability,
    [DEVICE_FEATURE_TYPES.CURTAIN.POSITION]: blindRangeControllerCapability,
  },
};

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
  [DEVICE_FEATURE_CATEGORIES.SHUTTER]: coverCategoryMapping,
  [DEVICE_FEATURE_CATEGORIES.CURTAIN]: coverCategoryMapping,
};

const coverReadValues = {
  state: (value) => {
    if (value === COVER_STATE.OPEN) {
      return BLIND_MODES.UP;
    }

    return BLIND_MODES.DOWN;
  },
  position: (value, { min, max }) => {
    return Math.round((value * 100) / max);
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
  [DEVICE_FEATURE_CATEGORIES.SHUTTER]: coverReadValues,
  [DEVICE_FEATURE_CATEGORIES.CURTAIN]: coverReadValues,
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
  [DIRECTIVE_NAMESPACES.ModeController]: (mode) => {
    if (mode === BLIND_MODES.UP) {
      return COVER_STATE.OPEN;
    }

    return COVER_STATE.CLOSE;
  },
  [DIRECTIVE_NAMESPACES.RangeController]: (directiveName, payload, currentValue, _, { min, max }) => {
    if (directiveName === 'AdjustRangeValue') {
      const newValue = currentValue + (payload.rangeValueDelta * max) / 100;
      if (newValue > max) {
        return max;
      }
      if (newValue < min) {
        return min;
      }
      return newValue;
    }

    return Math.round((payload.rangeValue * max) / 100);
  },
};

module.exports = { mappings, readValues, writeValues };
