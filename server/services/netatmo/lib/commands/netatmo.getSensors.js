/**
 * @description Get Sensors.
 * @returns {Array} Return array of sensor.
 * @example
 * netatmo.getSensor();
 */
async function getSensors() {
  return Object.keys(this.sensors).map((sensorId) => this.sensors[sensorId]);
}

module.exports = {
    getSensors,
};
