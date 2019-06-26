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

module.exports = {
  celsiusToFahrenheit,
  fahrenheitToCelsius,
};
