const logger = require('../../../../utils/logger');
const { getDeviceFeatureExternalId, getNodeStateInfoByExternalId } = require('../utils/overkiz.externalId');
const { unbindValue } = require('../utils/overkiz.bindValue');
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

    const deviceStates = await this.overkizServerAPI.get(`setup/devices/${encodeURIComponent(deviceURL)}/states`);

    logger.info(`Overkiz : Get new device states: ${deviceURL}`);

    deviceStates.forEach((state) => {
      switch (state.name) {
        case 'core:ComfortRoomTemperatureState':
        case 'core:EcoRoomTemperatureState':
        case 'core:TargetTemperatureState': // Consigne
        case 'io:EffectiveTemperatureSetpointState':
        case 'io:TargetHeatingLevelState': // Mode
          logger.info(`${state.name} has value ${state.value}`);
          break;
        default:
        //
      }
    });

    deviceStates.forEach((state) => {
      const deviceFeatureExternalId = getDeviceFeatureExternalId({ URL: deviceURL }, state.name);
      const newValueUnbind = unbindValue(device, state.name, state.value);
      const deviceFeature = this.gladys.stateManager.get('deviceFeatureByExternalId', deviceFeatureExternalId);
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
