/**
 * @description Return the battery percentage based on the voltage.
 * @param {number} voltage - Current voltage.
 * @param {number} minVolt - Min voltage of the device.
 * @param {number} maxVolt - Max voltage of the device.
 * @returns {number} Return the percentage.
 * @example
 * const percent = getBatteryPercent(3000, 2200, 3300);
 */
function getBatteryPercent(voltage, minVolt, maxVolt) {
  if (voltage <= minVolt) {
    return 0;
  }
  if (voltage >= maxVolt) {
    return 100;
  }
  return Math.round(((maxVolt - voltage) / (maxVolt - minVolt)) * 100);
}

module.exports = {
  getBatteryPercent,
};
