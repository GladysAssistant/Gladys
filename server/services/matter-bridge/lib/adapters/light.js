const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const {
  isNumber,
  toLevel,
  fromLevel,
  toMireds,
  fromMireds,
  colorToHueSaturation,
  hueSaturationToColor,
  xyToColor,
  MIREDS_MIN,
  MIREDS_MAX,
} = require('../converters');
const { COLOR_MODE } = require('../constants');
const { isFeature, zipRoles } = require('./helpers');

const { LIGHT } = DEVICE_FEATURE_TYPES;

// Optional in the ColorControl cluster, but mandatory for the colour light device types.
const REMAINING_TIME = { attributes: { remainingTime: true } };

/**
 * @description Pick the Gladys light features of a role.
 * @param {Array} features - Unclaimed features of the device.
 * @param {string} type - Gladys light feature type.
 * @returns {Array} The matching features.
 * @example
 * lightFeatures(features, 'brightness');
 */
function lightFeatures(features, type) {
  return features.filter((feature) => isFeature(feature, DEVICE_FEATURE_CATEGORIES.LIGHT, [type]));
}

/**
 * @description Choose the Matter light device type from the features the light has: the richer
 * the light, the more capable the Matter type, as the Matter device library defines them.
 * @param {object} matter - The matter.js modules.
 * @param {object} roles - Features of the light, by role.
 * @returns {object} The matter.js endpoint type.
 * @example
 * lightType(matter, { binary, brightness });
 */
function lightType(matter, roles) {
  const { devices, behaviors } = matter;
  if (roles.color) {
    // Every ecosystem sends its colours its own way, hue/saturation or CIE xy: both are accepted.
    // Colour temperature is mandatory for an extended colour light, so it is there even when the
    // Gladys light has no such feature.
    return devices.ExtendedColorLightDevice.with(
      behaviors.ColorControlServer.with('HueSaturation', 'Xy', 'ColorTemperature').enable(REMAINING_TIME),
    );
  }
  if (roles.temperature) {
    return devices.ColorTemperatureLightDevice.with(
      behaviors.ColorControlServer.with('ColorTemperature').enable(REMAINING_TIME),
    );
  }
  if (roles.brightness) {
    return devices.DimmableLightDevice;
  }
  return devices.OnOffLightDevice;
}

/**
 * @description Initial colour control state of a light.
 * @param {object} roles - Features of the light, by role.
 * @param {Function} read - Reads the last value of a feature.
 * @returns {object} The colorControl state.
 * @example
 * colorState({ color }, read);
 */
function colorState(roles, read) {
  const state = {
    colorTempPhysicalMinMireds: MIREDS_MIN,
    colorTempPhysicalMaxMireds: MIREDS_MAX,
    coupleColorTempToLevelMinMireds: MIREDS_MIN,
    startUpColorTemperatureMireds: null,
    remainingTime: 0,
    colorMode: roles.color ? COLOR_MODE.HUE_SATURATION : COLOR_MODE.COLOR_TEMPERATURE,
    enhancedColorMode: roles.color ? COLOR_MODE.HUE_SATURATION : COLOR_MODE.COLOR_TEMPERATURE,
  };
  const temperature = roles.temperature ? read(roles.temperature) : null;
  if (isNumber(temperature)) {
    state.colorTemperatureMireds = toMireds(temperature, roles.temperature);
  }
  const color = roles.color ? read(roles.color) : null;
  if (isNumber(color)) {
    Object.assign(state, colorToHueSaturation(color));
  }
  return state;
}

const light = {
  key: 'light',
  claim(features) {
    return zipRoles({
      binary: lightFeatures(features, LIGHT.BINARY),
      brightness: lightFeatures(features, LIGHT.BRIGHTNESS),
      temperature: lightFeatures(features, LIGHT.TEMPERATURE),
      color: lightFeatures(features, LIGHT.COLOR),
    }).filter((roles) => roles.binary);
  },
  build(matter, roles, ctx) {
    const state = { onOff: { onOff: ctx.read(roles.binary) === 1 } };
    const brightness = roles.brightness ? ctx.read(roles.brightness) : null;
    if (isNumber(brightness)) {
      state.levelControl = { currentLevel: toLevel(brightness, roles.brightness) };
    }
    if (roles.color || roles.temperature) {
      state.colorControl = colorState(roles, ctx.read);
    }
    return { type: lightType(matter, roles), state };
  },
  toMatter(role, value, roles) {
    switch (role) {
      case 'binary':
        return { onOff: { onOff: value === 1 } };
      case 'brightness':
        return { levelControl: { currentLevel: toLevel(value, roles.brightness) } };
      case 'temperature':
        return {
          colorControl: {
            colorTemperatureMireds: toMireds(value, roles.temperature),
            colorMode: COLOR_MODE.COLOR_TEMPERATURE,
            enhancedColorMode: COLOR_MODE.COLOR_TEMPERATURE,
          },
        };
      default:
        return {
          colorControl: {
            ...colorToHueSaturation(value),
            colorMode: COLOR_MODE.HUE_SATURATION,
            enhancedColorMode: COLOR_MODE.HUE_SATURATION,
          },
        };
    }
  },
  listeners: [
    {
      cluster: 'onOff',
      attribute: 'onOff',
      role: 'binary',
      toGladys: (state) => (state.onOff.onOff ? 1 : 0),
    },
    {
      cluster: 'levelControl',
      attribute: 'currentLevel',
      role: 'brightness',
      debounce: true,
      toGladys: (state, feature) =>
        isNumber(state.levelControl.currentLevel) ? fromLevel(state.levelControl.currentLevel, feature) : null,
    },
    {
      cluster: 'colorControl',
      attribute: 'colorTemperatureMireds',
      role: 'temperature',
      debounce: true,
      toGladys: (state, feature) =>
        state.colorControl.colorMode === COLOR_MODE.COLOR_TEMPERATURE
          ? fromMireds(state.colorControl.colorTemperatureMireds, feature)
          : null,
    },
    ...['currentHue', 'currentSaturation', 'currentX', 'currentY'].map((attribute) => ({
      cluster: 'colorControl',
      attribute,
      role: 'color',
      debounce: true,
      toGladys: (state) => {
        const { colorMode, currentHue, currentSaturation, currentX, currentY } = state.colorControl;
        if (colorMode === COLOR_MODE.HUE_SATURATION) {
          return hueSaturationToColor(currentHue, currentSaturation);
        }
        if (colorMode === COLOR_MODE.XY) {
          return xyToColor(currentX, currentY);
        }
        return null;
      },
    })),
  ],
};

module.exports = light;
