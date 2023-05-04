/**
 * @description Convert celsius to fahrenheit.
 * @param {number} celsius - Temperature to convert.
 * @returns {number} Return the temperature in fahrenheit.
 * @example
 * const tempF = celsiusToFahrenheit(12);
 */
function celsiusToFahrenheit(celsius) {
  return (celsius * 9) / 5 + 32;
}

/**
 * @description Convert fahrenheit to celsius.
 * @param {number} fahrenheit - Temperature to convert.
 * @returns {number} Return the temperature in celsius.
 * @example
 * const tempC = fahrenheitToCelsius(100);
 */
function fahrenheitToCelsius(fahrenheit) {
  return ((fahrenheit - 32) * 5) / 9;
}

const hueToRgb = (p, q, t2) => {
  let t = t2;
  if (t < 0) {
    t += 1;
  }
  if (t > 1) {
    t -= 1;
  }
  if (t < 1 / 6) {
    return p + (q - p) * 6 * t;
  }
  if (t < 1 / 2) {
    return q;
  }
  if (t < 2 / 3) {
    return p + (q - p) * (2 / 3 - t) * 6;
  }
  return p;
};

/**
 * @description Converts an HSL color value to RGB.
 * @param {number} h - The hue.
 * @param {number} s - The saturation.
 * @param {number} l - The lightness/brightness.
 * @returns {Array} The RGB representation.
 * @example
 * const rgb = hslToRgb(260, 50, 50);
 */
function hslToRgb(h, s, l) {
  // Achromatic
  if (s === 0) {
    return [l, l, l];
  }
  const h2 = h / 360;

  const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
  const p = 2 * l - q;

  return [
    Math.round(hueToRgb(p, q, h2 + 1 / 3) * 255),
    Math.round(hueToRgb(p, q, h2) * 255),
    Math.round(hueToRgb(p, q, h2 - 1 / 3) * 255),
  ];
}

module.exports = {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  hslToRgb,
};
