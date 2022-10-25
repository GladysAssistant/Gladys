const axios = require('axios');
const retry = require('async-retry');
const logger = require('../../../../utils/logger');
const { getDeviceFeatureExternalId, getNodeStateInfoByExternalId } = require('../utils/overkiz.externalId');
const { unbindValue } = require('../utils/overkiz.bindValue');
const { connect } = require('./overkiz.connect');
const { EVENTS, DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

/**
 * @description Update device states.
 * @param {Object} device - Deviceto update states.
 * @returns {Promise<Object>} Return Object of informations.
 * @example
 * overkiz.getDevicesStates();
 */
async function getDevicesStates(device) {
  logger.info(`Overkiz : Get device state...`);

  device.features.map(async (feature) => {
    const { deviceURL } = getNodeStateInfoByExternalId(feature);

    const response = await retry(
      async (bail) => {
        const tryResponse = await axios.get(
          `${this.overkizServer.endpoint}setup/devices/${encodeURIComponent(deviceURL)}/states`,
          {
            headers: {
              'Cache-Control': 'no-cache',
              Host: this.overkizServer.endpoint.substring(
                this.overkizServer.endpoint.indexOf('/') + 2,
                this.overkizServer.endpoint.indexOf('/', 8),
              ),
              Connection: 'Keep-Alive',
              Cookie: `JSESSIONID=${this.sessionCookie}`,
            },
          },
        );
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

    logger.info(`Overkiz : Get new device states: ${deviceURL}`);

    response.data.forEach((state) => {
      const deviceFeatureExternalId = getDeviceFeatureExternalId({ deviceURL }, state.name);
      const newValueUnbind = unbindValue(device, state.name, state.value);
      const deviceFeature = this.gladys.stateManager.get('deviceFeatureByExternalId', deviceFeatureExternalId);
      if (deviceFeature) {
        if(deviceFeature.category !== DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR ||
          newValueUnbind !== 0) {
            this.eventManager.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: deviceFeatureExternalId,
              state: newValueUnbind,
            });
        }
      }
    });
  });
}

module.exports = {
  getDevicesStates,
};
