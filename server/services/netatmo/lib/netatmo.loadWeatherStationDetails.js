const { default: axios } = require('axios');
const logger = require('../../../utils/logger');
const { API, SUPPORTED_CATEGORY_TYPE } = require('./utils/netatmo.constants');

/**
 * @description Discover Netatmo cloud weather stations.
 * @returns {Promise} List of discovered  weather stations and modules.
 * @example
 * await loadWeatherStationDetails();
 */
async function loadWeatherStationDetails() {
  logger.debug('loading Weather Stations details...');
  let weatherStations;
  const modulesWeatherStations = [];
  try {
    const response = await axios({
      url: API.GET_WEATHER_STATIONS,
      method: 'get',
      headers: { accept: API.HEADER.ACCEPT, Authorization: `Bearer ${this.accessToken}` },
    });
    const { body, status } = response.data;
    weatherStations = body.devices;
    if (status === 'ok') {
      weatherStations.forEach((weatherStation) => {
        if (!this.configuration.weatherApi) {
          weatherStation.apiNotConfigured = true;
        } else {
          weatherStation.apiNotConfigured = false;
        }
        weatherStation.categoryAPI = SUPPORTED_CATEGORY_TYPE.WEATHER;
        weatherStation.modules.forEach((module) => {
          const { modules, ...rest } = weatherStation;
          module.plug = rest;
          if (!this.configuration.weatherApi) {
            module.apiNotConfigured = true;
          } else {
            module.apiNotConfigured = false;
          }
          module.home_id = weatherStation.home_id;
          module.categoryAPI = SUPPORTED_CATEGORY_TYPE.WEATHER;
        });
        modulesWeatherStations.push(...weatherStation.modules);
      });
    }
    logger.debug('Weather Stations details loaded in home');
    return { weatherStations, modulesWeatherStations };
  } catch (e) {
    logger.error('Error getting Weather Stations details - error: ', e);
    return { weatherStations: undefined, modulesWeatherStations: undefined };
  }
}

module.exports = {
  loadWeatherStationDetails,
};
