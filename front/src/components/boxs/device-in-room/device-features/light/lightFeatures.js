import get from 'get-value';

import { getDeviceFeatureName } from '../../../../../utils/device';

import {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS
} from '../../../../../../../server/utils/constants';
import { hsbToRgb, intToHex, kelvinToRGB, miredToKelvin } from '../../../../../../../server/utils/colors';

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

// Full ranges of the HSB model hsbToRgb expects, whatever bounds the hue and saturation features
// declare on their own side.
const MAX_HUE_DEGREES = 360;
const MAX_SATURATION = 100;
const MAX_BRIGHTNESS = 100;

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

/**
 * @description Gives the name the user typed for a feature in the widget editor, if any.
 * `device_feature_names` is not "the names the user chose": the editor pre-fills every entry with
 * the generated label of its feature ("Ceiling light (Brightness)"), so a `new_label` only carries
 * an intention when it differs from that default. Rebuilding the default is the only way to tell
 * the two apart.
 * @param {object} dictionary - The i18n dictionary, needed to rebuild the generated label.
 * @param {object} device - The device the feature belongs to.
 * @param {object} feature - The device feature.
 * @returns {string} The custom name, or null.
 * @example getCustomFeatureName(dictionary, device, feature);
 */
export const getCustomFeatureName = (dictionary, device, feature) => {
  const { new_label: newLabel } = feature;
  if (!newLabel || newLabel === getDeviceFeatureName(dictionary, device, feature)) {
    return null;
  }
  return newLabel;
};

/**
 * @description Gives the name of a grouped light row. Users rename features in the widget editor
 * precisely because their device name is too long for a dashboard, so a name they typed on any of
 * the grouped features wins over the device name.
 * @param {object} dictionary - The i18n dictionary.
 * @param {object} device - The device of the light.
 * @param {Array} features - The light features of that device, in display order.
 * @returns {string} The name to display on the row and in the panel.
 * @example getLightName(dictionary, device, features);
 */
export const getLightName = (dictionary, device, features) => {
  const customNames = features.map(feature => getCustomFeatureName(dictionary, device, feature)).filter(Boolean);
  return customNames.length > 0 ? customNames[0] : device.name;
};

/**
 * @description Reads when a feature was last written, as a comparable number.
 * @param {object} feature - The device feature.
 * @returns {number} A timestamp, 0 when the feature never carried one.
 * @example getChangedAt({ last_value_changed: '2026-08-21T08:00:00.000Z' });
 */
const getChangedAt = feature => {
  const time = feature && feature.last_value_changed ? new Date(feature.last_value_changed).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
};

/**
 * @description Scales a feature value onto another range, through its own bounds.
 * @param {object} feature - The device feature.
 * @param {number} outputMax - The maximum of the target range, whose minimum is 0.
 * @returns {number} The scaled value.
 * @example scaleValue({ min: 0, max: 100, last_value: 50 }, 360);
 */
const scaleValue = (feature, outputMax) => (valueToPercent(feature, feature.last_value) / 100) * outputMax;

/**
 * @description The color a light is showing through its RGB features — the color feature, or the
 * hue / saturation pair for the integrations exposing them separately.
 * @param {Array} features - The light features of one device.
 * @returns {object} The CSS color and the feature dating it, or null.
 * @example getRgbColorSource(features);
 */
const getRgbColorSource = features => {
  const colorFeature = getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.COLOR);
  // A color of 0 is black, which a lit lamp never shows: integrations use it as "never written".
  if (colorFeature && Number.isFinite(colorFeature.last_value) && colorFeature.last_value > 0) {
    return { feature: colorFeature, color: `#${intToHex(colorFeature.last_value)}` };
  }

  const hueFeature = getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.HUE);
  if (!hueFeature || !Number.isFinite(hueFeature.last_value)) {
    return null;
  }
  const saturationFeature = getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.SATURATION);
  const hasSaturation = saturationFeature && Number.isFinite(saturationFeature.last_value);
  // Brightness is its own feature: the swatch shows the hue at full value, not the dimmed light.
  const [red, green, blue] = hsbToRgb([
    scaleValue(hueFeature, MAX_HUE_DEGREES),
    hasSaturation ? scaleValue(saturationFeature, MAX_SATURATION) : MAX_SATURATION,
    MAX_BRIGHTNESS
  ]);
  const datingFeature =
    hasSaturation && getChangedAt(saturationFeature) > getChangedAt(hueFeature) ? saturationFeature : hueFeature;
  return { feature: datingFeature, color: `rgb(${red}, ${green}, ${blue})` };
};

/**
 * @description The color a light is showing through its color temperature feature.
 * @param {Array} features - The light features of one device.
 * @returns {object} The CSS color and the feature dating it, or null.
 * @example getTemperatureColorSource(features);
 */
const getTemperatureColorSource = features => {
  const temperatureFeature = getLightFeature(features, DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE);
  if (!temperatureFeature || !Number.isFinite(temperatureFeature.last_value)) {
    return null;
  }
  return {
    feature: temperatureFeature,
    color: temperatureValueToCssColor(temperatureFeature, temperatureFeature.last_value)
  };
};

/**
 * @description Gives the color a light is currently showing, used to tint the row and the panel.
 * An RGB+CCT lamp keeps both a color and a color temperature, and only one of them is what it is
 * showing right now: the one written last wins, so switching a lamp back to white stops painting
 * the row with the red it was set to an hour ago.
 * @param {Array} features - The light features of one device.
 * @returns {string} A CSS color, or null when the light has no color information.
 * @example getLightCssColor(features);
 */
export const getLightCssColor = features => {
  const rgbSource = getRgbColorSource(features);
  const temperatureSource = getTemperatureColorSource(features);
  if (rgbSource && temperatureSource) {
    return getChangedAt(temperatureSource.feature) > getChangedAt(rgbSource.feature)
      ? temperatureSource.color
      : rgbSource.color;
  }
  const source = rgbSource || temperatureSource;
  return source ? source.color : null;
};
