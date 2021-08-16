const c2xterm = require('color2xterm');
const { intToHex } = require('../../../../utils/colors');

/**
 * @description Convert an integer to an 8 bits hexa code.
 * @param {string} intColor - A number.
 * @returns {string} - The converted hexa code.
 * @example
 * to8bitsHex(15022);
 * console.log(int === FF);
 */
function to8bitsHex(intColor) {
  // really sleazy...
  let s = '';
  let n = intColor;
  for (; n >= 0; n /= 16) {
    const rem = n % 16;
    n -= rem;
    if (rem === 15) {
      s = `F${s}`;
    } else if (rem === 14) {
      s = `E${s}`;
    } else if (rem === 13) {
      s = `D${s}`;
    } else if (rem === 12) {
      s = `C${s}`;
    } else if (rem === 11) {
      s = `B${s}`;
    } else if (rem === 10) {
      s = `A${s}`;
    } else {
      s = `${rem}${s}`;
    }
    if (n === 0) {
      break;
    }
  }
  return s;
}

/**
 * @description Convert an integer from color picker to an 8 bits hexa color code.
 * @param {string} intColor - A number.
 * @returns {string} - The converted hexa code.
 * @example
 * intTo8bitsColorHex(15022);
 * console.log(int === FF);
 */
function intTo8bitsColorHex(intColor) {
  const hex = intToHex(intColor);
  // Find closest 8bit color code
  const colorCode = c2xterm.hex2xterm(hex);
  return to8bitsHex(colorCode);
}

module.exports = {
  intTo8bitsColorHex,
  to8bitsHex,
};
