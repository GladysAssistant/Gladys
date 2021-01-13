/**
 * @description Converts int color to RGB object.
 * @param {number} intColor - Color between 0 and 16777215.
 * @returns {Array} [ red, green, blue ] object.
 * @example
 * const rgb = intToRgb(255);
 * {
 *  red: 255,
 *  blue: 0,
 *  green: 0,
 * }
 */
function intToRgb(intColor) {
  // eslint-disable-next-line no-bitwise
  const red = intColor >> 16;
  // eslint-disable-next-line no-bitwise
  const green = (intColor - (red << 16)) >> 8;
  // eslint-disable-next-line no-bitwise
  const blue = intColor - (red << 16) - (green << 8);

  return [red, green, blue];
}

/**
 * @description Converts RGB array color to int.
 * @param {Array} rgb - [red, green, blue ] array.
 * @returns {number} IntColor - Color between 0 and 16777215.
 * @example
 * const int = rgbToInt([ 255, 0, 0 ]);
 * console.log(hex === 255);
 */
function rgbToInt(rgb) {
  const [red, green, blue] = rgb;

  // eslint-disable-next-line no-bitwise
  return (red << 16) | (green << 8) | blue;
}

/**
 * @description Converts int color to HEX.
 * @param {number} intColor - Color between 0 and 16777215.
 * @returns {string} Hex string.
 * @example
 * const hex = intToHex(255);
 * console.log(hex === '0000FF');
 */
function intToHex(intColor) {
  return `${intColor.toString(16).padStart(6, '0')}`;
}

/**
 * @description Converts HEX color to int.
 * @param {string} hexColor - Hex string between 0 and FFFFFF.
 * @returns {number} Int color.
 * @example
 * const int = hexToInt('0000FF');
 * console.log(int === 255);
 */
function hexToInt(hexColor) {
  if (hexColor.startsWith('#')) {
    return parseInt(hexColor.substring(1), 16);
  }

  return parseInt(hexColor, 16);
}

module.exports = {
  intToRgb,
  rgbToInt,
  intToHex,
  hexToInt,
};
