const { UNIT_CONVERSIONS } = require('./unit-conversions');

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

/**
 * @description Smart rounding for display:
 * - No rounding if value < 1 (keep full precision)
 * - 2 decimals if value < 10
 * - 1 decimal if value < 1000
 * - No decimals (integer) if value >= 1000.
 * @param {number} value - Value to round.
 * @returns {number} Rounded value.
 * @example
 * smartRound(0.123); // returns 0.123
 * smartRound(2.54321); // returns 2.54
 * smartRound(45.67); // returns 45.7
 * smartRound(1234.56); // returns 1235
 */
function smartRound(value) {
  if (Math.abs(value) < 1) {
    return value; // No rounding for very small values
  }
  if (Math.abs(value) < 10) {
    return Math.round(value * 100) / 100; // 2 decimals
  }
  if (Math.abs(value) < 1000) {
    return Math.round(value * 10) / 10; // 1 decimal
  }
  return Math.round(value); // Integer for large values
}

/**
 * @description Converts a value from one unit to another according to the user's preference.
 * @param {number} value - Value to convert.
 * @param {string} fromUnit - Original unit (e.g. 'km', 'mile', 'km/h', ...).
 * @param {string} userPreference - User preference ('us' or 'metric').
 * @returns {{ value: number, unit: string }} Object containing the converted value and the target unit.
 * @example
 * const result = convertUnit(10, DEVICE_FEATURE_UNITS.KM, SYSTEM_UNITS.US);
 * // result = { value: 6.21, unit: 'mile' }
 */
function checkAndConvertUnit(value, fromUnit, userPreference) {
  const unitsConvertUserPreference = UNIT_CONVERSIONS[userPreference];
  if (!unitsConvertUserPreference) {
    // No conversion: keep the original value and unit
    return { value, unit: fromUnit };
  }
  const unitConversionParams = unitsConvertUserPreference[fromUnit];
  if (!unitConversionParams) {
    // No conversion: keep the original value and unit
    return { value, unit: fromUnit };
  }
  if (value !== null) {
    // Convert the value and apply smart rounding
    const convertedValue = smartRound(unitConversionParams.convert(value));
    return { value: convertedValue, unit: unitConversionParams.unit };
  }
  // When value is null, we still want to get the correct unit format
  return { value, unit: unitConversionParams.unit };
}

module.exports = {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
  hslToRgb,
  checkAndConvertUnit,
  smartRound,
};
