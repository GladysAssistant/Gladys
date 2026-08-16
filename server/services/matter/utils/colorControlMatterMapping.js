const { xyToInt, intToXy } = require('../../../utils/colors');

// In the Matter ColorControl cluster, CurrentX/CurrentY are uint16 attributes
// holding the CIE xyY chromaticity multiplied by 65536.
const MATTER_XY_FACTOR = 65536;
// The maximum value allowed by the Matter specification for CurrentX/CurrentY
// and for the color temperature expressed in mireds.
const MATTER_MAX_UINT16_VALUE = 65279;

// Gladys stores the light color temperature in mireds, like Zigbee2mqtt and Philips Hue.
// Those defaults (6535K - 2000K) are used when the bulb does not advertise its physical range.
const DEFAULT_MIN_MIREDS = 153;
const DEFAULT_MAX_MIREDS = 500;

/**
 * @description Convert the Matter CurrentX/CurrentY attributes to the Gladys int color.
 * @param {number} currentX - The Matter CurrentX attribute (0 - 65279).
 * @param {number} currentY - The Matter CurrentY attribute (0 - 65279).
 * @returns {number} The Gladys int color.
 * @example
 * const intColor = matterXyToInt(45914, 19615);
 */
function matterXyToInt(currentX, currentY) {
  return xyToInt(currentX / MATTER_XY_FACTOR, currentY / MATTER_XY_FACTOR);
}

/**
 * @description Convert a Gladys int color to the Matter ColorX/ColorY command fields.
 * @param {number} intColor - The Gladys int color (0 - 16777215).
 * @returns {object} An object with the colorX and colorY Matter values.
 * @example
 * const { colorX, colorY } = intToMatterXy(16711680);
 */
function intToMatterXy(intColor) {
  const { x, y } = intToXy(intColor);
  return {
    colorX: Math.min(Math.round(x * MATTER_XY_FACTOR), MATTER_MAX_UINT16_VALUE),
    colorY: Math.min(Math.round(y * MATTER_XY_FACTOR), MATTER_MAX_UINT16_VALUE),
  };
}

/**
 * @description Tell if a value read from a Matter device is a usable mireds value.
 * @param {any} value - The value read on the Matter device.
 * @returns {boolean} True if the value can be used as a mireds bound.
 * @example
 * const valid = isValidMireds(153);
 */
function isValidMireds(value) {
  return typeof value === 'number' && Number.isFinite(value) && value > 0 && value <= MATTER_MAX_UINT16_VALUE;
}

/**
 * @description Build the Gladys min/max mireds range from the physical range advertised by the bulb.
 * @param {any} physicalMinMireds - The ColorTempPhysicalMinMireds attribute.
 * @param {any} physicalMaxMireds - The ColorTempPhysicalMaxMireds attribute.
 * @returns {object} An object with the min and max mireds values.
 * @example
 * const { min, max } = getColorTemperatureMiredsRange(153, 500);
 */
function getColorTemperatureMiredsRange(physicalMinMireds, physicalMaxMireds) {
  const min = isValidMireds(physicalMinMireds) ? physicalMinMireds : DEFAULT_MIN_MIREDS;
  const max = isValidMireds(physicalMaxMireds) ? physicalMaxMireds : DEFAULT_MAX_MIREDS;
  // Some devices advertise an inconsistent range, in that case we fallback to the Gladys defaults
  if (max <= min) {
    return { min: DEFAULT_MIN_MIREDS, max: DEFAULT_MAX_MIREDS };
  }
  return { min, max };
}

module.exports = {
  matterXyToInt,
  intToMatterXy,
  isValidMireds,
  getColorTemperatureMiredsRange,
  MATTER_XY_FACTOR,
  MATTER_MAX_UINT16_VALUE,
  DEFAULT_MIN_MIREDS,
  DEFAULT_MAX_MIREDS,
};
