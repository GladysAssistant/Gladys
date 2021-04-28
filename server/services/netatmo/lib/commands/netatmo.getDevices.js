/**
 * @description Get Device.
 * @returns {Array} Return array of devices.
 * @param {string} mode - Data received.
 * @example
 * netatmo.getDevices(type);
 */
async function getDevices(mode = '') {
  // We get the data from the house of Netatmo Energy (valves and thermostats)
  await this.getHomeStatusData(mode);

  // We get the data from the house of Netatmo Security
  await this.getHomeData(mode);

  // we get the weather stations
  await this.getStationsData(mode);

  // we get the homeCoachs
  await this.getHealthyHomeCoachData(mode);
}

module.exports = {
  getDevices,
};
