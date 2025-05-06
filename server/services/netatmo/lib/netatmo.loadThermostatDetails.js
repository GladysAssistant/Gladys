const { fetch } = require('undici');
const logger = require('../../../utils/logger');
const { API, SUPPORTED_CATEGORY_TYPE } = require('./utils/netatmo.constants');

/**
 * @description Discover Netatmo cloud thermostats.
 * @returns {Promise} List of discovered thermostats and modules.
 * @example
 * await loadThermostatDetails();
 */
async function loadThermostatDetails() {
  logger.debug('loading Thermostats details...');
  let plugs;
  const thermostats = [];
  try {
    const responseGetThermostat = await fetch(API.GET_THERMOSTATS, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': API.HEADER.CONTENT_TYPE,
        Accept: API.HEADER.ACCEPT,
      },
    });
    const rawBody = await responseGetThermostat.text();
    if (!responseGetThermostat.ok) {
      logger.error('Netatmo error: ', responseGetThermostat.status, rawBody);
    }
    const data = JSON.parse(rawBody);
    const { body, status } = data;
    plugs = body.devices;
    if (status === 'ok') {
      plugs.forEach((plug) => {
        if (!this.configuration.energyApi) {
          plug.apiNotConfigured = true;
        } else {
          plug.apiNotConfigured = false;
        }
        plug.categoryAPI = SUPPORTED_CATEGORY_TYPE.ENERGY;
        plug.modules.forEach((module) => {
          const { modules, ...rest } = plug;
          module.plug = rest;
          if (!this.configuration.energyApi) {
            module.apiNotConfigured = true;
          } else {
            module.apiNotConfigured = false;
          }
          module.categoryAPI = SUPPORTED_CATEGORY_TYPE.ENERGY;
        });
        thermostats.push(...plug.modules);
      });
    }
    logger.debug('Thermostats details loaded in home');
    return { plugs, thermostats };
  } catch (e) {
    logger.error('Error getting thermostats details - error: ', e);
    return { plugs: undefined, thermostats: undefined };
  }
}

module.exports = {
  loadThermostatDetails,
};
