/**
 * @description Return list of sensors.
 * @returns {Array} Return array of sensor.
 * @example
 * xiaomi.getSensors();
 */
function getSensors() {
  return Object.keys(this.sensors).map((sensorId) => this.sensors[sensorId]);
}

module.exports = {
  getSensors,
};
