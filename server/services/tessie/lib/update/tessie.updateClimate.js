const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { readValues } = require('../device/tessie.deviceMapping');
const { BASE_API, API } = require('../utils/tessie.constants');

/**
 * @description Save values of Smart Home Weather Station NAMain Indoor.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} vehicle - Vehicle object coming from the Tessie API.
 * @param {string} vin - Vehicle identifier in Tessie.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateCharge(deviceGladys, vehicle, externalId);
 */
async function updateClimate(deviceGladys, vehicle, vin, externalId) {
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
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: climateOnFeature.external_id,
          state: climateState.is_climate_on ? 1 : 0,
        });
      }
      if (indoorTemperatureFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: indoorTemperatureFeature.external_id,
          state: climateState.inside_temp,
        });
      }
      if (outsideTemperatureFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: outsideTemperatureFeature.external_id,
          state: climateState.outside_temp,
        });
      }
      if (targetTemperatureFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: targetTemperatureFeature.external_id,
          state: climateState.target_temp,
        });
      }
    }
  } catch (e) {
    logger.error('deviceGladys Climate: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateClimate,
};
