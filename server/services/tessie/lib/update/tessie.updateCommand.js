const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const shouldUpdateFeature = require('../utils/shouldUpdateFeature');

/**
 * @description Save values of Smart Home Weather Station NAMain Indoor.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} vehicle - Vehicle object coming from the Tessie API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateCommand(deviceGladys, vehicle, externalId);
 */
async function updateCommand(deviceGladys, vehicle, externalId) {
  const { vehicle_state: vehicleState } = vehicle;

  const alarmFeature = deviceGladys.features.find((f) => f.external_id === `${externalId}:alarm`);
  const lockFeature = deviceGladys.features.find((f) => f.external_id === `${externalId}:lock`);

  try {
    if (vehicleState) {
      if (alarmFeature) {
        const newValue = vehicleState.sentry_mode ? 1 : 0;
        if (shouldUpdateFeature(alarmFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: alarmFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated alarm: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped alarm: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (lockFeature) {
        const newValue = vehicleState.locked ? 1 : 0;
        if (shouldUpdateFeature(lockFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: lockFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated lock: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped lock: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
    }
  } catch (e) {
    logger.error('deviceGladys Command: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateCommand,
};
