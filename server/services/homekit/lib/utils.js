/**
 * @description Normalize value to new range.
 * @param {number} value - Actual value.
 * @param {number} currentMin - Actual possible min value.
 * @param {number} currentMax - Actual possible max value.
 * @param {number} newRangeMin - Target possible min value.
 * @param {number} newRangeMax - Target possible max value.
 * @returns {number} New value in target range.
 * @example
 * normalize(5, 0, 255, 0, 360)
 */
function normalize(value, currentMin, currentMax, newRangeMin, newRangeMax) {
  return ((newRangeMax - newRangeMin) * (value - currentMin)) / (currentMax - currentMin) + newRangeMin;
}

module.exports = {
  normalize,
};
