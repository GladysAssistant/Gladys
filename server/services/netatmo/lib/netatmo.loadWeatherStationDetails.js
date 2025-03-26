const { fetch } = require('undici');
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
  // let weatherStations;
  // const modulesWeatherStations = [];
  const modules = [];
  try {
    const response = await fetch(API.GET_WEATHER_STATIONS, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': API.HEADER.CONTENT_TYPE,
        Accept: API.HEADER.ACCEPT,
      },
    });
    const rawBody = await response.text();
    if (!response.ok) {
      logger.error('Netatmo error: ', response.status, rawBody);
    }

    const data = JSON.parse(rawBody);
    const { body, status } = data;
    const { devices } = body;
    // weatherStations = body.devices;
    if (status === 'ok') {
      devices.forEach((device) => {
        if (!this.configuration.weatherApi) {
          device.apiNotConfigured = true;
        } else {
          device.apiNotConfigured = false;
        }
        device.categoryAPI = SUPPORTED_CATEGORY_TYPE.WEATHER;
        device.modules.forEach((module) => {
          const { modules: mods, ...rest } = device;
          module.plug = rest;
          if (!this.configuration.weatherApi) {
            module.apiNotConfigured = true;
          } else {
            module.apiNotConfigured = false;
          }
          module.home_id = device.home_id;
          module.categoryAPI = SUPPORTED_CATEGORY_TYPE.WEATHER;
        });
        modules.push(...device.modules);
      });
    }
    logger.debug('Weather Stations details loaded in home');
    return { devices, modules };
  } catch (e) {
    logger.error('Error getting Weather Stations details - error: ', e);
    return { devices: undefined, modules: undefined };
  }
}

module.exports = {
  loadWeatherStationDetails,
};
