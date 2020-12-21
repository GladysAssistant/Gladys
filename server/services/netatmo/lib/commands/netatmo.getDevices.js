const logger = require('../../../../utils/logger');

/**
 * @description Get Device.
 * @param {string} type - Netatmo Type of devices needed.
 * @returns {Array} Return array of devices.
 * @example
 * netatmo.getDevices(type);
 */
async function getDevices(type) {
  // we get the thermostats
  this.getThermostatsData();

  // We get the data from the house of Netatmo Energy
  this.getHomeStatusData();

  // We get the data from the house of Netatmo Security
  this.getHomeData();

  // we get the weather stations
  this.getStationsData();
  
  // we get the homeCoachs
  this.getHealthyHomeCoachData();

}

module.exports = {
  getDevices,
};
