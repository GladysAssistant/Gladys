const { default: axios } = require('axios');
const logger = require('../../../utils/logger');
const { API } = require('./utils/netatmo.constants');

/**
 * @description Discover Netatmo cloud thermostats.
 * @returns {Promise} List of discovered thermostats and modules.
 * @example
 * await loadThermostatDetails();
 */
async function loadThermostatDetails() {
  logger.debug('loading Thermostats details...');
  let thermostats;
  const modules = [];
  try {
    const responseGetThermostat = await axios({
      url: API.GET_THERMOSTATS,
      method: 'get',
      headers: { accept: API.HEADER.ACCEPT, Authorization: `Bearer ${this.accessToken}` },
    });
    const { body: bodyGetThermostat, status: statusGetThermostat } = responseGetThermostat.data;
    thermostats = bodyGetThermostat.devices;
    if (statusGetThermostat === 'ok') {
      thermostats.forEach((thermostat) => {
        modules.push(...thermostat.modules);
      });
    }
    logger.debug('Thermostats details loaded in home');
    return { thermostats, modules };
  } catch (e) {
    logger.error(
      'Error getting thermostats details - status error: ',
      e.statusGetThermostat,
      ' data error: ',
      e.response.data.error,
    );
    return { thermostats: undefined, modules: undefined };
  }
}

module.exports = {
  loadThermostatDetails,
};
