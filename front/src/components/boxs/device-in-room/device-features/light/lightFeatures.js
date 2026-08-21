import get from 'get-value';

import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS
} from '../../../../../../../server/utils/constants';
import { intToHex, kelvinToRGB, miredToKelvin } from '../../../../../../../server/utils/colors';

// The light feature types the light panel knows how to control. Anything else carried by a light
// device (consumed power, effect mode, effect speed...) keeps its own regular row.
export const LIGHT_PANEL_TYPES = [
  DEVICE_FEATURE_TYPES.LIGHT.BINARY,
  DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
  DEVICE_FEATURE_TYPES.LIGHT.COLOR,
  DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
  DEVICE_FEATURE_TYPES.LIGHT.HUE,
  DEVICE_FEATURE_TYPES.LIGHT.SATURATION
];

// A light exposing only an on/off feature is already well served by the plain switch row: the
// panel is only worth opening when there is something to dose (brightness, color, temperature).
const DOSABLE_LIGHT_TYPES = [
  DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
  DEVICE_FEATURE_TYPES.LIGHT.COLOR,
  DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
  DEVICE_FEATURE_TYPES.LIGHT.HUE,
  DEVICE_FEATURE_TYPES.LIGHT.SATURATION
];

// White range the color-temperature slider paints when the feature carries a scale we cannot
// read as a physical unit (see temperatureValueToKelvin).
const COLDEST_DISPLAYED_KELVIN = 6600;
const WARMEST_DISPLAYED_KELVIN = 2000;

// A mired scale never starts at (or near) zero — zero mired would be an infinite temperature —
// while the arbitrary scales integrations use are percentages starting at 0.
const LOWEST_MIRED_LIKE_MINIMUM = 100;
// Above this, a value can only be kelvins — the mired range of a real lamp tops out around 500.
const LOWEST_KELVIN_LIKE_VALUE = 1000;

// Bounds of what kelvinToRGB paints as a believable white.
const PAINTABLE_MIN_KELVIN = 1500;
const PAINTABLE_MAX_KELVIN = 10000;

/**
 * @description Tells if a device feature is controlled by the light panel.
 * @param {object} feature - The device feature to test.
 * @returns {boolean} True when the feature belongs to the light panel.
 * @example isLightPanelFeature({ category: 'light', type: 'brightness', read_only: false });
 */
export const isLightPanelFeature = feature =>
  feature.category === DEVICE_FEATURE_CATEGORIES.LIGHT &&
  feature.read_only === false &&
  LIGHT_PANEL_TYPES.includes(feature.type);

/**
 * @description Finds a light feature by its type.
 * @param {Array} features - The light features of one device.
 * @param {string} type - The device feature type to look for.
 * @returns {object} The matching feature, or undefined.
 * @example getLightFeature(features, 'brightness');
 */
export const getLightFeature = (features, type) => features.find(feature => feature.type === type);

// The features of a same light are grouped by their device. The id always comes with the device the
// widget expands; the selector is a fallback so a payload without it still groups.
const getDeviceKey = feature => get(feature, 'device.id') || get(feature, 'device.selector');

/**
 * @description Builds the rows of the devices widget: all the light features of a same device are
 * merged into one row opening the light panel, every other feature keeps its own row.
 * @param {Array} deviceFeatures - The device features displayed by the widget, in display order.
 * @returns {Array} The rows to render, in display order.
 * @example buildDeviceRows(deviceFeatures);
 */
export const buildDeviceRows = (deviceFeatures = []) => {
  // Only lights with something to dose are grouped: a device holding just an on/off light feature
  // keeps the switch row it has always had.
  const groupedDeviceIds = deviceFeatures
    .filter(
      feature => getDeviceKey(feature) && isLightPanelFeature(feature) && DOSABLE_LIGHT_TYPES.includes(feature.type)
    )
    .map(getDeviceKey);

  const rows = [];
  const lightRowByDeviceId = {};

  deviceFeatures.forEach((deviceFeature, index) => {
    const deviceId = getDeviceKey(deviceFeature);
    const belongsToLightPanel = deviceId && groupedDeviceIds.includes(deviceId) && isLightPanelFeature(deviceFeature);

    if (!belongsToLightPanel) {
      rows.push({ key: `feature-${index}`, index, deviceFeature });
      return;
    }

    let lightRow = lightRowByDeviceId[deviceId];
    if (!lightRow) {
      // The group takes the place of the first light feature of its device, so the order the user
      // configured in the widget is preserved.
      lightRow = { key: `light-${deviceId}`, index, device: deviceFeature.device, features: [] };
      lightRowByDeviceId[deviceId] = lightRow;
      rows.push(lightRow);
    }
    lightRow.features.push(deviceFeature);
  });

  return rows;
};

// Color temperature has no unit of its own in Gladys: integrations expose mireds (Philips Hue,
// Tasmota, Zigbee...), kelvins, or a plain 0-100 scale. The scale is decided once from the BOUNDS
// of the feature — deciding value by value would put the two ends of a same slider on two
// different scales.
const TEMPERATURE_SCALES = { KELVIN: 'kelvin', MIRED: 'mired', RATIO: 'ratio' };

const getTemperatureScale = feature => {
  if (feature.unit === DEVICE_FEATURE_UNITS.KELVIN) {
    return TEMPERATURE_SCALES.KELVIN;
  }
  const max = Number.isFinite(feature.max) ? feature.max : 100;
  if (max >= LOWEST_KELVIN_LIKE_VALUE) {
    return TEMPERATURE_SCALES.KELVIN;
  }
  const min = Number.isFinite(feature.min) ? feature.min : 0;
  if (min >= LOWEST_MIRED_LIKE_MINIMUM) {
    return TEMPERATURE_SCALES.MIRED;
  }
  return TEMPERATURE_SCALES.RATIO;
};

/**
 * @description Converts a color temperature value to kelvins, whatever scale the integration uses.
 * @param {object} feature - The light temperature device feature.
 * @param {number} value - The value to convert.
 * @returns {number} The color temperature in kelvins.
 * @example temperatureValueToKelvin({ min: 153, max: 500 }, 153);
 */
export const temperatureValueToKelvin = (feature, value) => {
  const scale = getTemperatureScale(feature);
  if (scale === TEMPERATURE_SCALES.KELVIN) {
    return value;
  }
  if (scale === TEMPERATURE_SCALES.MIRED) {
    return value > 0 ? miredToKelvin(value) : COLDEST_DISPLAYED_KELVIN;
  }
  // Arbitrary scale (a percentage, most of the time): spread it over the usual white range,
  // keeping the convention of the historical slider — the minimum is the cold end.
  const min = Number.isFinite(feature.min) ? feature.min : 0;
  const max = Number.isFinite(feature.max) ? feature.max : 100;
  const ratio = max === min ? 0 : (value - min) / (max - min);
  return COLDEST_DISPLAYED_KELVIN - ratio * (COLDEST_DISPLAYED_KELVIN - WARMEST_DISPLAYED_KELVIN);
};

/**
 * @description Builds the CSS color of a color temperature value.
 * @param {object} feature - The light temperature device feature.
 * @param {number} value - The value to convert.
 * @returns {string} A CSS rgb() color.
 * @example temperatureValueToCssColor({ min: 153, max: 500 }, 153);
 */
export const temperatureValueToCssColor = (feature, value) => {
  // kelvinToRGB is only meaningful on the range of a real lamp: an out-of-range bound (a feature
  // declared with a wrong min/max) must not paint a black or a saturated slider.
  const kelvin = Math.min(
    PAINTABLE_MAX_KELVIN,
    Math.max(PAINTABLE_MIN_KELVIN, temperatureValueToKelvin(feature, value))
  );
  const [red, green, blue] = kelvinToRGB(kelvin);
  return `rgb(${red}, ${green}, ${blue})`;
};

/**
 * @description Builds the gradient painted on a color temperature slider. The ends are derived from
 * the feature bounds, so a feature in kelvins (cold at the top) and one in mireds (cold at the
 * bottom) both get a gradient matching what the lamp will actually do.
 * @param {object} feature - The light temperature device feature.
 * @returns {string} A CSS linear-gradient.
 * @example temperatureGradient({ min: 153, max: 500 });
 */
export const temperatureGradient = feature => {
  const min = Number.isFinite(feature.min) ? feature.min : 0;
  const max = Number.isFinite(feature.max) ? feature.max : 100;
  const numberOfStops = 6;
  const stops = [];
  for (let index = 0; index < numberOfStops; index += 1) {
    const value = min + ((max - min) * index) / (numberOfStops - 1);
    stops.push(temperatureValueToCssColor(feature, value));
  }
  return `linear-gradient(to right, ${stops.join(', ')})`;
};

/**
 * @description Gives the color a light is currently showing, used to tint the row and the panel.
 * @param {Array} features - The light features of one device.
 * @returns {string} A CSS color, or null when the light has no color information.
 * @example getLightCssColor(features);
 */
export const getLightCssColor = features => {
  const colorFeature = getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.COLOR);
  if (colorFeature && Number.isFinite(colorFeature.last_value)) {
    return `#${intToHex(colorFeature.last_value)}`;
  }
  const temperatureFeature = getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE);
  if (temperatureFeature && Number.isFinite(temperatureFeature.last_value)) {
    return temperatureValueToCssColor(temperatureFeature, temperatureFeature.last_value);
  }
  return null;
};

/**
 * @description Converts a feature value to a percentage of its own range.
 * @param {object} feature - The device feature.
 * @param {number} value - The value to convert.
 * @returns {number} A percentage between 0 and 100.
 * @example valueToPercent({ min: 0, max: 254 }, 127);
 */
export const valueToPercent = (feature, value) => {
  const min = Number.isFinite(feature.min) ? feature.min : 0;
  const max = Number.isFinite(feature.max) ? feature.max : 100;
  if (max === min || !Number.isFinite(value)) {
    return 0;
  }
  return Math.round(Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100)));
};
