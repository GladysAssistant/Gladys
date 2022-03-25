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

/**
 * @description Reverse Gamma correction applied in rgbToXy.
 * @param {number} value - Color value.
 * @returns {number} ReversedGammaCorrectedValue - Color with Gamma added.
 * @example
 * const value = getReversedGammaCorrectedValue(0,5);
 * console.log(value === 0.73535698305);
 */
function getReversedGammaCorrectedValue(value) {
  return value <= 0.0031308 ? 12.92 * value : (1.0 + 0.055) * value ** (1.0 / 2.4) - 0.055;
}

/**
 * @description Converts XY color (CIE 1931 color space) to int.
 * @param {number} x - X color.
 * @param {number} y - Y color.
 * @returns {number} Int color.
 * @example
 * const int = xyToInt(0.701, 0.299);
 * console.log(int === 16711680);
 */
function xyToInt(x, y) {
  const xy = {
    x,
    y,
  };

  // Compute XYZ values
  const Y = 1.0;
  const X = (Y / xy.y) * xy.x;
  const Z = (Y / xy.y) * (1.0 - xy.x - xy.y);

  // Convert to RGB using Wide RGB D50 conversion
  let r = X * 1.656492 - Y * 0.354851 - Z * 0.255038;
  let g = -X * 0.707196 + Y * 1.655397 + Z * 0.036152;
  let b = X * 0.051713 - Y * 0.121364 + Z * 1.01153;

  // Apply gamma Conversion
  r = getReversedGammaCorrectedValue(r);
  g = getReversedGammaCorrectedValue(g);
  b = getReversedGammaCorrectedValue(b);

  const max = Math.max(r, g, b);
  if (max > 1) {
    r /= max;
    g /= max;
    b /= max;
  }

  const red = Math.max(0, Math.round(r * 255));
  const green = Math.max(0, Math.round(g * 255));
  const blue = Math.max(0, Math.round(b * 255));

  // Convert to int
  // eslint-disable-next-line no-bitwise
  return (red << 16) | (green << 8) | blue;
}

/**
 * @description Converts HSV color to int.
 * @param {Object} hsvColor - HSV color object.
 * @returns {number} Int color.
 * @example
 * const int = hsvToInt({ h: 87, s: 24, v: 66 });
 * console.log(int === 9873536);
 */
function hsvToInt(hsvColor) {
  const { h: hue, s: saturation, v: value } = hsvColor;
  const h = hue / 60;
  const s = saturation / 100;
  let v = value / 100;
  const hi = Math.floor(h) % 6;

  const f = h - Math.floor(h);
  const p = 255 * v * (1 - s);
  const q = 255 * v * (1 - s * f);
  const t = 255 * v * (1 - s * (1 - f));
  v *= 255;

  let rgb;
  switch (hi) {
    case 0:
      rgb = [v, t, p];
      break;
    case 1:
      rgb = [q, v, p];
      break;
    case 2:
      rgb = [p, v, t];
      break;
    case 3:
      rgb = [p, q, v];
      break;
    case 4:
      rgb = [t, p, v];
      break;
    case 5:
      rgb = [v, p, q];
      break;
    default:
      rgb = [0, 0, 0];
  }

  return rgbToInt(rgb);
}

/**
 * @description Converts int color to HSV.
 * @param {number} intColor - Int color.
 * @returns {Object} HSV color.
 * @example
 * const hsv = intToHsv(9873536);
 * console.log(hsv); // { h: 87, s: 24, v: 66 }
 */
function intToHsv(intColor) {
  const [red, green, blue] = intToRgb(intColor);

  const r = red / 255;
  const g = green / 255;
  const b = blue / 255;
  const v = Math.max(r, g, b);
  const diff = v - Math.min(r, g, b);
  const diffc = (c) => {
    return (v - c) / 6 / diff + 1 / 2;
  };

  let h = 0;
  let s = 0;
  if (diff !== 0) {
    s = diff / v;
    const rdif = diffc(r);
    const gdif = diffc(g);
    const bdif = diffc(b);

    if (r === v) {
      h = bdif - gdif;
    } else if (g === v) {
      h = 1 / 3 + rdif - bdif;
    } else if (b === v) {
      h = 2 / 3 + gdif - rdif;
    }

    if (h < 0) {
      h += 1;
    } else if (h > 1) {
      h -= 1;
    }
  }

  return { h: Math.round(h * 360), s: Math.round(s * 1000) / 10, v: Math.round(v * 1000) / 10 };
}

module.exports = {
  intToRgb,
  rgbToInt,
  intToHex,
  hexToInt,
  xyToInt,
  hsvToInt,
  intToHsv,
};
