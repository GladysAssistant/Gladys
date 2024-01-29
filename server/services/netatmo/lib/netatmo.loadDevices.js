const Promise = require('bluebird');
const { default: axios } = require('axios');
const logger = require('../../../utils/logger');
const { API } = require('./utils/netatmo.constants');

/**
 * @description Discover Netatmo cloud devices.
 * @returns {Promise} List of discovered devices.
 * @example
 * await loadDevices();
 */
async function loadDevices() {
  try {
    const responsePage = await axios({
      url: API.HOMESDATA,
      method: 'get',
      headers: { accept: API.HEADER.ACCEPT, Authorization: `Bearer ${this.accessToken}` },
    });
    const { body, status } = responsePage.data;
    const { homes } = body;
    let listHomeDevices = [];
    if (status === 'ok') {
      const results = await Promise.map(
        homes,
        async (home) => {
          const { modules } = home;
          if (modules) {
            return this.loadDeviceDetails(home);
          }
          return undefined;
        },
        { concurrency: 2 },
      );
      listHomeDevices = results.filter((device) => device !== undefined).flat();
    }
    logger.debug(`${listHomeDevices.length} Netatmo devices loaded`);
    logger.info(`Netatmo devices not supported : ${listHomeDevices.filter((device) => device.not_handled).length}`);
    return listHomeDevices;
  } catch (e) {
    logger.error('e.status: ', e.status, 'e.data.error', e.response.data.error);
    return undefined;
  }
}

module.exports = {
  loadDevices,
};
