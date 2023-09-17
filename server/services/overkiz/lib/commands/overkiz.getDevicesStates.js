const logger = require('../../../../utils/logger');
const { getDeviceFeatureExternalId, getNodeStateInfoByExternalId } = require('../utils/overkiz.externalId');
const { unbindValue } = require('../utils/overkiz.bindValue');
const { EVENTS, DEVICE_FEATURE_CATEGORIES } = require('../../../../utils/constants');

/**
 * @description Update device states.
 * @param {object} device - Device to update states.
 * @returns {Promise<object>} Return Object of informations.
 * @example
 * overkiz.getDevicesStates();
 */
async function getDevicesStates(device) {
  logger.info(`Overkiz : Get devices state...`);

  device.features.map(async (feature) => {
    const { deviceURL } = getNodeStateInfoByExternalId(feature);
    const deviceStates = await this.overkizServerAPI.get(`setup/devices/${encodeURIComponent(deviceURL)}/states`);

    logger.info(`Overkiz : Get new device states: ${deviceURL}`);
    deviceStates.forEach(async (state) => {
      const deviceFeatureExternalId = getDeviceFeatureExternalId({ deviceURL }, state.name);
      const deviceFeature = this.gladys.stateManager.get('deviceFeatureByExternalId', deviceFeatureExternalId);
      const newValueUnbind = unbindValue(device, deviceFeature, state.value);
      if (deviceFeature) {
        if (deviceFeature.category !== DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR || newValueUnbind !== 0) {
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
