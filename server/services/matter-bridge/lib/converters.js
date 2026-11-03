const { DEVICE_FEATURE_UNITS } = require('../../../utils/constants');
const { normalize } = require('../../../utils/device');
const { intToRgb, rgbToHsb, hsbToRgb, rgbToInt, xyToInt } = require('../../../utils/colors');
const { fahrenheitToCelsius } = require('../../../utils/units');
const { AIR_QUALITY, BAT_CHARGE_LEVEL } = require('./constants');

// Matter ranges, from the cluster specifications.
const LEVEL_MIN = 1;
const LEVEL_MAX = 254;
const MIREDS_MIN = 153;
const MIREDS_MAX = 500;
const HUE_SATURATION_MAX = 254;
const PERCENT_100THS_MAX = 10000;
const XY_MAX = 65536;
const ILLUMINANCE_MAX = 65534;
const INT16_MAX = 32767;

// Factors to hectopascals, which is the unit of the Matter pressure attribute (0.1 kPa).
const TO_HECTOPASCAL = {
  [DEVICE_FEATURE_UNITS.PASCAL]: 0.01,
  [DEVICE_FEATURE_UNITS.HECTO_PASCAL]: 1,
  [DEVICE_FEATURE_UNITS.MILLIBAR]: 1,
  [DEVICE_FEATURE_UNITS.KILO_PASCAL]: 10,
  [DEVICE_FEATURE_UNITS.BAR]: 1000,
  [DEVICE_FEATURE_UNITS.PSI]: 68.9476,
};

const LOW_BATTERY = 20;
const CRITICAL_BATTERY = 10;

/**
 * @description Tell if a value is a usable number.
 * @param {any} value - Value to test.
 * @returns {boolean} True for a finite number.
 * @example
 * isNumber(12); // true
 */
function isNumber(value) {
  return typeof value === 'number' && Number.isFinite(value);
}

/**
 * @description Keep a number inside a range.
 * @param {number} value - Value to bound.
 * @param {number} min - Lower bound.
 * @param {number} max - Upper bound.
 * @returns {number} The bounded value.
 * @example
 * clamp(300, 0, 254); // 254
 */
function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

/**
 * @description Read the range of a Gladys feature, 0 to 100 when it does not declare one.
 * @param {object} feature - Gladys feature.
 * @returns {Array<number>} Its min and max.
 * @example
 * featureRange({ min: 0, max: 255 }); // [0, 255]
 */
function featureRange(feature) {
  const min = isNumber(feature.min) ? feature.min : 0;
  const max = isNumber(feature.max) ? feature.max : 100;
  return [min, max];
}

/**
 * @description Convert a Gladys brightness to a Matter level.
 * @param {number} value - Gladys brightness.
 * @param {object} feature - Gladys brightness feature.
 * @returns {number} Matter level, 1 to 254.
 * @example
 * toLevel(50, { min: 0, max: 100 }); // 128
 */
function toLevel(value, feature) {
  const [min, max] = featureRange(feature);
  return Math.round(normalize(value, min, max, LEVEL_MIN, LEVEL_MAX));
}

/**
 * @description Convert a Matter level to a Gladys brightness.
 * @param {number} level - Matter level, 1 to 254.
 * @param {object} feature - Gladys brightness feature.
 * @returns {number} Gladys brightness.
 * @example
 * fromLevel(254, { min: 0, max: 100 }); // 100
 */
function fromLevel(level, feature) {
  const [min, max] = featureRange(feature);
  return Math.round(normalize(level, LEVEL_MIN, LEVEL_MAX, min, max));
}

/**
 * @description Convert a Gladys colour temperature to Matter mireds. The low end of the Gladys
 * range is the coldest white, as for the HomeKit bridge.
 * @param {number} value - Gladys colour temperature.
 * @param {object} feature - Gladys colour temperature feature.
 * @returns {number} Mireds, 153 to 500.
 * @example
 * toMireds(0, { min: 0, max: 100 }); // 153
 */
function toMireds(value, feature) {
  const [min, max] = featureRange(feature);
  return Math.round(normalize(value, min, max, MIREDS_MIN, MIREDS_MAX));
}

/**
 * @description Convert Matter mireds to a Gladys colour temperature.
 * @param {number} mireds - Mireds.
 * @param {object} feature - Gladys colour temperature feature.
 * @returns {number} Gladys colour temperature.
 * @example
 * fromMireds(500, { min: 0, max: 100 }); // 100
 */
function fromMireds(mireds, feature) {
  const [min, max] = featureRange(feature);
  return Math.round(normalize(mireds, MIREDS_MIN, MIREDS_MAX, min, max));
}

/**
 * @description Convert a Gladys colour (RGB integer) to Matter hue and saturation.
 * @param {number} color - RGB integer.
 * @returns {object} Matter currentHue and currentSaturation, 0 to 254.
 * @example
 * colorToHueSaturation(0xff0000); // { currentHue: 0, currentSaturation: 254 }
 */
function colorToHueSaturation(color) {
  const [hue, saturation] = rgbToHsb(intToRgb(color));
  return {
    currentHue: Math.round((hue * HUE_SATURATION_MAX) / 360),
    currentSaturation: Math.round((saturation * HUE_SATURATION_MAX) / 100),
  };
}

/**
 * @description Convert Matter hue and saturation to a Gladys colour, at full brightness: the
 * brightness lives on its own feature.
 * @param {number} hue - Matter hue, 0 to 254.
 * @param {number} saturation - Matter saturation, 0 to 254.
 * @returns {number} RGB integer.
 * @example
 * hueSaturationToColor(0, 254); // 0xff0000
 */
function hueSaturationToColor(hue, saturation) {
  return rgbToInt(hsbToRgb([(hue * 360) / HUE_SATURATION_MAX, (saturation * 100) / HUE_SATURATION_MAX, 100]));
}

/**
 * @description Convert Matter CIE xy coordinates to a Gladys colour.
 * @param {number} x - Matter currentX, 0 to 65536.
 * @param {number} y - Matter currentY, 0 to 65536.
 * @returns {number|null} RGB integer, or null for a y of zero which has no colour.
 * @example
 * xyToColor(45940, 19595);
 */
function xyToColor(x, y) {
  if (!y) {
    return null;
  }
  return xyToInt(x / XY_MAX, y / XY_MAX);
}

/**
 * @description Convert a Gladys cover position to a Matter lift position. Gladys counts the top of
 * its range as open, Matter counts 0 as open and 10000 as closed.
 * @param {number} value - Gladys position.
 * @param {object} feature - Gladys position feature.
 * @returns {number} Matter position in hundredths of a percent.
 * @example
 * toLiftPercent100ths(100, { min: 0, max: 100 }); // 0
 */
function toLiftPercent100ths(value, feature) {
  const [min, max] = featureRange(feature);
  return Math.round(normalize(value, min, max, PERCENT_100THS_MAX, 0));
}

/**
 * @description Convert a Matter lift position to a Gladys cover position.
 * @param {number} percent100ths - Matter position, 0 (open) to 10000 (closed).
 * @param {object} feature - Gladys position feature.
 * @returns {number} Gladys position.
 * @example
 * fromLiftPercent100ths(0, { min: 0, max: 100 }); // 100
 */
function fromLiftPercent100ths(percent100ths, feature) {
  const [min, max] = featureRange(feature);
  return Math.round(normalize(percent100ths, PERCENT_100THS_MAX, 0, min, max));
}

/**
 * @description Convert a Gladys temperature to the Matter measured value (hundredths of °C).
 * @param {number} value - Gladys temperature.
 * @param {string} unit - Gladys unit of the feature.
 * @returns {number} Hundredths of a degree Celsius.
 * @example
 * toCelsius100ths(21.5, 'celsius'); // 2150
 */
function toCelsius100ths(value, unit) {
  const celsius = unit === DEVICE_FEATURE_UNITS.FAHRENHEIT ? fahrenheitToCelsius(value) : value;
  return clamp(Math.round(celsius * 100), -27315, INT16_MAX);
}

/**
 * @description Convert a Gladys relative humidity to the Matter measured value.
 * @param {number} value - Humidity in percent.
 * @returns {number} Hundredths of a percent.
 * @example
 * toHumidity100ths(45); // 4500
 */
function toHumidity100ths(value) {
  return clamp(Math.round(value * 100), 0, PERCENT_100THS_MAX);
}

/**
 * @description Convert lux to the logarithmic Matter illuminance value.
 * @param {number} lux - Illuminance in lux.
 * @returns {number} 10000 * log10(lux) + 1, or 0 in the dark.
 * @example
 * luxToIlluminance(1); // 1
 */
function luxToIlluminance(lux) {
  if (lux <= 0) {
    return 0;
  }
  return clamp(Math.round(10000 * Math.log10(lux) + 1), 1, ILLUMINANCE_MAX);
}

/**
 * @description Convert a Gladys pressure to the Matter measured value (0.1 kPa, that is hPa).
 * @param {number} value - Gladys pressure.
 * @param {string} unit - Gladys unit of the feature, hPa when missing or unknown.
 * @returns {number} Pressure in hectopascals.
 * @example
 * toPressure(1, 'bar'); // 1000
 */
function toPressure(value, unit) {
  const factor = TO_HECTOPASCAL[unit] || 1;
  return clamp(Math.round(value * factor), -INT16_MAX, INT16_MAX);
}

/**
 * @description Convert a Gladys battery level to the Matter PowerSource attributes.
 * @param {number} value - Battery level in percent.
 * @returns {object} The batPercentRemaining (half percents) and batChargeLevel attributes.
 * @example
 * toBattery(15); // { batPercentRemaining: 30, batChargeLevel: 1 }
 */
function toBattery(value) {
  let batChargeLevel = BAT_CHARGE_LEVEL.OK;
  if (value < CRITICAL_BATTERY) {
    batChargeLevel = BAT_CHARGE_LEVEL.CRITICAL;
  } else if (value < LOW_BATTERY) {
    batChargeLevel = BAT_CHARGE_LEVEL.WARNING;
  }
  return { batPercentRemaining: clamp(Math.round(value * 2), 0, 200), batChargeLevel };
}

// Upper bounds of each air quality level, from the WHO 2021 PM2.5 guideline steps and the usual
// indoor CO2 comfort levels. The first range a value falls under gives its level.
const PM25_LEVELS = [
  [15, AIR_QUALITY.GOOD],
  [25, AIR_QUALITY.FAIR],
  [37.5, AIR_QUALITY.MODERATE],
  [50, AIR_QUALITY.POOR],
  [75, AIR_QUALITY.VERY_POOR],
];
const CO2_LEVELS = [
  [800, AIR_QUALITY.GOOD],
  [1000, AIR_QUALITY.FAIR],
  [1500, AIR_QUALITY.MODERATE],
  [2000, AIR_QUALITY.POOR],
  [5000, AIR_QUALITY.VERY_POOR],
];

/**
 * @description Find the air quality level of a concentration.
 * @param {number} value - Concentration.
 * @param {Array} levels - Upper bounds and their level.
 * @returns {number} Matter AirQuality value.
 * @example
 * levelOf(10, PM25_LEVELS); // AIR_QUALITY.GOOD
 */
function levelOf(value, levels) {
  const found = levels.find(([bound]) => value < bound);
  return found ? found[1] : AIR_QUALITY.EXTREMELY_POOR;
}

/**
 * @description Derive the Matter air quality from the concentrations the device measures. Matter
 * apps show the AirQuality attribute first, and Gladys sensors only carry concentrations.
 * PM2.5 wins over CO2 when both are known: it is the health indicator.
 * @param {object} concentrations - Known concentrations.
 * @param {number} [concentrations.pm25] - PM2.5 in µg/m³.
 * @param {number} [concentrations.co2] - CO2 in ppm.
 * @returns {number} Matter AirQuality value.
 * @example
 * airQualityOf({ co2: 600 }); // AIR_QUALITY.GOOD
 */
function airQualityOf({ pm25, co2 }) {
  if (isNumber(pm25)) {
    return levelOf(pm25, PM25_LEVELS);
  }
  if (isNumber(co2)) {
    return levelOf(co2, CO2_LEVELS);
  }
  return AIR_QUALITY.UNKNOWN;
}

module.exports = {
  isNumber,
  clamp,
  toLevel,
  fromLevel,
  toMireds,
  fromMireds,
  colorToHueSaturation,
  hueSaturationToColor,
  xyToColor,
  toLiftPercent100ths,
  fromLiftPercent100ths,
  toCelsius100ths,
  toHumidity100ths,
  luxToIlluminance,
  toPressure,
  toBattery,
  airQualityOf,
  MIREDS_MIN,
  MIREDS_MAX,
};
