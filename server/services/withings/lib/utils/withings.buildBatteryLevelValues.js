/**
 * @description Returns array with battery value(index 0 = numeric value, index 1 = string value).
 *
 * @param {string} currentBatValueString - String withings value of battery.
 * @returns {Array} Array with battery value(index 0 = numeric value, index 1 = string value).
 * @example
 * buildBatteryLevelValues('low'')
 */
function buildBatteryLevelValues(currentBatValueString) {
  let batValueString;
  let batValue;

  switch (currentBatValueString) {
    case 'low':
      batValueString = `${currentBatValueString} (< 20%)`;
      batValue = 20;
      break;
    case 'medium':
      batValueString = `${currentBatValueString} (> 50%)`;
      batValue = 50;
      break;
    case 'high':
      batValueString = `${currentBatValueString} (100%)`;
      batValue = 100;
      break;
    default:
      batValueString = `No value`;
      batValue = 0;
      break;
  }
  return [batValue, batValueString];
}

module.exports = {
  buildBatteryLevelValues,
};
