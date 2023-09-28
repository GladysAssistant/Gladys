const logger = require('../../../utils/logger');
const { MELCLOUD_ENDPOINT } = require('./utils/melcloud.constants');

/**
 * @description Discover MELCloud devices.
 * @returns {Promise} List of discovered devices.
 * @example
 * await loadDevices();
 */
async function loadDevices() {
  const { data: response } = await this.client.get(`${MELCLOUD_ENDPOINT}/User/ListDevices`, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (X11; Linux x86_64; rv:73.0) ',
      Accept: 'application/json, text/javascript, */*; q=0.01',
      'Accept-Language': 'en-US,en;q=0.5',
      'Accept-Encoding': 'gzip, deflate, br',
      'X-MitsContextKey': this.contextKey,
      'X-Requested-With': 'XMLHttpRequest',
      Cookie: 'policyaccepted=true',
    },
  });

  const devices = [];

  response.forEach((house) => {
    devices.push(...house.Structure.Devices);
    house.Structure.Areas.forEach((area) => devices.push(...area.Devices));
    house.Structure.Floors.forEach((floor) => {
      devices.push(...floor.Devices);
      floor.Areas.forEach((area) => devices.push(...area.Devices));
    });
  });

  logger.debug(`${devices.length} MELCloud devices loaded`);

  return devices;
}

module.exports = {
  loadDevices,
};
