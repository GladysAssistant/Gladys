const { default: axios } = require('axios');
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
    const responseGetThermostat = await axios({
      url: API.GET_THERMOSTATS,
      method: 'get',
      headers: { accept: API.HEADER.ACCEPT, Authorization: `Bearer ${this.accessToken}` },
    });
    const { body, status } = responseGetThermostat.data;
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
