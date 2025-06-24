const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const shouldUpdateFeature = require('../utils/shouldUpdateFeature');

/**
 * @description Save values of Smart Home Weather Station NAMain Indoor.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} vehicle - Vehicle object coming from the Tessie API.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateClimate(deviceGladys, vehicle, externalId);
 */
async function updateClimate(deviceGladys, vehicle, externalId) {
  const { climate_state: climateState } = vehicle;

  const climateOnFeature = deviceGladys.features.find((f) => f.external_id === `${externalId}:climate_on`);
  const indoorTemperatureFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:indoor_temperature`,
  );
  const outsideTemperatureFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:outside_temperature`,
  );
  const targetTemperatureFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:target_temperature`,
  );

  try {
    if (climateState) {
      if (climateOnFeature) {
        const newValue = climateState.is_climate_on ? 1 : 0;
        if (shouldUpdateFeature(climateOnFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: climateOnFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated climate_on: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped climate_on: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (indoorTemperatureFeature) {
        const newValue = climateState.inside_temp;
        if (shouldUpdateFeature(indoorTemperatureFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: indoorTemperatureFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated indoor_temperature: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped indoor_temperature: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (outsideTemperatureFeature) {
        const newValue = climateState.outside_temp;
        if (shouldUpdateFeature(outsideTemperatureFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: outsideTemperatureFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated outside_temperature: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped outside_temperature: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
      if (targetTemperatureFeature) {
        const newValue = climateState.driver_temp_setting;
        if (shouldUpdateFeature(targetTemperatureFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: targetTemperatureFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated target_temperature: ${newValue} for device ${deviceGladys.name}`);
        } else {
          logger.debug(`Skipped target_temperature: value unchanged (${newValue}) for device ${deviceGladys.name}`);
        }
      }
    }
  } catch (e) {
    logger.error('deviceGladys Climate: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateClimate,
};
