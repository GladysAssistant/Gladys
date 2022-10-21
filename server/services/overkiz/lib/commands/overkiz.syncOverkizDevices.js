const axios = require('axios');
const retry = require('async-retry');
const logger = require('../../../../utils/logger');

const { updateGatewayState } = require('../overkiz.util');
const { updateDevicesState } = require('../overkiz.util');
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
  this.scanInProgress = true;

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
      onRetry: async (err, num) => {
        if (err.response && err.response.status === 401) {
          await connect.bind(this)();
          logger.info(`Overkiz : Connecting Overkiz server...`);
        } else {
          throw err;
        }
      },
    },
  );

  updateGatewayState.bind(this)(response.data.gateways);

  updateDevicesState.bind(this)(response.data.devices, response.data.rootPlace);

  this.scanInProgress = true;
}

module.exports = {
  syncOverkizDevices,
};
