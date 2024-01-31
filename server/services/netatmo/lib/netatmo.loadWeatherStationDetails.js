const { default: axios } = require('axios');
const logger = require('../../../utils/logger');
const { API } = require('./utils/netatmo.constants');

/**
 * @description Discover Netatmo cloud weather stations.
 * @returns {Promise} List of discovered  weather stations and modules.
 * @example
 * await loadWeatherStationDetails();
 */
async function loadWeatherStationDetails() {
  logger.debug('loading Weather Stations details...');
  let weatherStations;
  const modules = [];
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
        modules.push(...weatherStation.modules);
      });
    }
    logger.debug('Weather Stations details loaded in home');
    return { weatherStations, modules };
  } catch (e) {
    logger.error(
      'Error getting Weather Stations details - status error: ',
      e.status,
      ' data error: ',
      e.response.data.error,
    );
    return { weatherStations: undefined, modules: undefined };
  }
}

module.exports = {
  loadWeatherStationDetails,
};
