const axios = require('axios');
const retry = require('async-retry');
const logger = require('../../../../utils/logger');

const { updateGatewayState } = require('../overkiz.util');
const { connect } = require('./overkiz.connect');
const { ServiceNotConfiguredError } = require('../../../../utils/coreErrors');

/**
 * @description Synchronize Overkiz devices.
 * @returns {Promise<Object>} Overkiz devices.
 * @example
 * overkiz.syncOverkizDevices();
 */
async function syncOverkizDevices() {
  if (!this.connected) {
    throw new ServiceNotConfiguredError('OVERKIZ_NOT_CONNECTED');
  }
  logger.debug(`Overkiz : Starting discovery`);

  const response = await retry(
    async (bail) => {
      const tryResponse = await axios.get(`${this.overkizServer.endpoint}setup`, {
        headers: {
          'Cache-Control': 'no-cache',
          Host: this.overkizServer.endpoint.substring(
            this.overkizServer.endpoint.indexOf('/') + 2,
            this.overkizServer.endpoint.indexOf('/', 8),
          ),
          Connection: 'Keep-Alive',
          Cookie: `JSESSIONID=${this.sessionCookie}`,
        },
      });
      return tryResponse;
    },
    {
      retries: 5,
      onRetry: (err, num) => {
        if (err.response && err.response.status === 401) {
          connect.bind(this)();
          logger.info(`Overkiz : Connecting Overkiz server...`);
        } else {
          throw err;
        }
      },
    },
  );

  this.devices = {};
  response.data.devices.forEach((device) => {
    const placeObj = response.data.rootPlace.subPlaces.find((place) => place.oid === device.placeOID);
    if (placeObj) {
      device.place = placeObj.label;
    }
    this.devices[device.oid] = device;
  });

  updateGatewayState(response.data.gateways);

  return this.devices;
}

module.exports = {
  syncOverkizDevices,
};
