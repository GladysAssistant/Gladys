/**
 * @description Get Device.
 * @returns {Array} Return array of devices.
 * @example
 * netatmo.getDevices(type);
 */
async function getDevices() {
  // we get the thermostats
  await this.getThermostatsData();

  // We get the data from the house of Netatmo Energy
  await this.getHomeStatusData();

  // We get the data from the house of Netatmo Security
  await this.getHomeData();

  // we get the weather stations
  await this.getStationsData();

  // we get the homeCoachs
  await this.getHealthyHomeCoachData();
}

module.exports = {
  getDevices,
};
