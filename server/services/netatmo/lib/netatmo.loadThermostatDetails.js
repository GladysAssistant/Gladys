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
  // let plugs;
  // const thermostats = [];
  const modules = [];
  try {
    const response = await axios({
      url: API.GET_THERMOSTATS,
      method: 'get',
      headers: { accept: API.HEADER.ACCEPT, Authorization: `Bearer ${this.accessToken}` },
    });
    const { body, status } = response.data;
    const { devices } = body;
    // plugs = body.devices;
    if (status === 'ok') {
      devices.forEach((device) => {
        if (!this.configuration.energyApi) {
          device.apiNotConfigured = true;
        } else {
          device.apiNotConfigured = false;
        }
        device.categoryAPI = SUPPORTED_CATEGORY_TYPE.ENERGY;
        device.modules.forEach((module) => {
          const { modules: mods, ...rest } = device;
          module.plug = rest;
          if (!this.configuration.energyApi) {
            module.apiNotConfigured = true;
          } else {
            module.apiNotConfigured = false;
          }
          module.categoryAPI = SUPPORTED_CATEGORY_TYPE.ENERGY;
        });
        modules.push(...device.modules);
      });
    }
    logger.debug('Thermostats details loaded in home');
    return { devices, modules };
  } catch (e) {
    logger.error('Error getting thermostats details - error: ', e);
    return { devices: undefined, modules: undefined };
  }
}

module.exports = {
  loadThermostatDetails,
};
