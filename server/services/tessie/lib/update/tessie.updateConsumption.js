const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { BASE_API, API } = require('../utils/tessie.constants');
const shouldUpdateFeature = require('../utils/shouldUpdateFeature');

/**
 * @description Save values of Smart Home Weather Station NAMain Indoor.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {string} vin - Vehicle identifier in Tessie.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateConsumption(deviceGladys, vehicle, externalId);
 */
async function updateConsumption(deviceGladys, vin, externalId) { 

  // Get vehicle consumption
  const consumptionResponse = await fetch(`${BASE_API}/${vin}${API.VEHICLE_CONSUMPTION}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${this.configuration.apiKey}`,
      'Content-Type': API.HEADER.CONTENT_TYPE,
      Accept: API.HEADER.ACCEPT,
    },
  });
  if (consumptionResponse.status !== 200) {
    logger.error(`Error getting consumption for vehicle ${vin}:`, await consumptionResponse.text());
    return;
  }
  const consumption = await consumptionResponse.json();

  const consumptionEnergyConsumption100MiFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:energy_consumption_100mile`,
  );
  const consumptionEnergyConsumption100MiByDrivingFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:energy_consumption_100mile_by_driving`,
  );
  const consumptionEnergyConsumptionMiFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:energy_consumption_mile`,
  );
  const consumptionEnergyConsumptionMiByDrivingFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:energy_consumption_mile_by_driving`,
  );
  const consumptionEnergyEfficiencyFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:energy_efficiency`,
  );
  const consumptionEnergyEfficiencyByDrivingFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:energy_efficiency_by_driving`,
  );

  try {
    if (consumption) {
      const {
        rated_range_used,
        rated_range_used_by_driving,
        ideal_range_used,
        ideal_range_used_by_driving,
        distance_driven,
        energy_used,
        energy_used_by_driving,
      } = consumption;
      const energyConsumption100mi = (energy_used / rated_range_used) * 100 || (energy_used / ideal_range_used) * 100;
      const energyConsumption100miByDriving = (energy_used_by_driving / rated_range_used_by_driving) * 100 || (energy_used_by_driving / ideal_range_used_by_driving) * 100;
      const energyConsumptionMi = (energy_used * 1000) / distance_driven || (energy_used * 1000) / distance_driven;
      const energyConsumptionMiByDriving = (energy_used_by_driving * 1000) / distance_driven || (energy_used_by_driving * 1000) / distance_driven;
      const energyEfficiency = distance_driven / energy_used || distance_driven / energy_used;
      const energyEfficiencyByDriving = distance_driven / energy_used_by_driving || distance_driven / energy_used_by_driving;

      if (consumptionEnergyConsumption100MiFeature) {
        if (shouldUpdateFeature(consumptionEnergyConsumption100MiFeature, energyConsumption100mi)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: consumptionEnergyConsumption100MiFeature.external_id,
            state: energyConsumption100mi,
          });
          logger.debug(`Updated energy_consumption_100mile: ${energyConsumption100mi} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped energy_consumption_100mile: value unchanged (${energyConsumption100mi}) for VIN ${vin}`);
        }
      }
      if (consumptionEnergyConsumption100MiByDrivingFeature) {
        if (shouldUpdateFeature(consumptionEnergyConsumption100MiByDrivingFeature, energyConsumption100miByDriving)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: consumptionEnergyConsumption100MiByDrivingFeature.external_id,
            state: energyConsumption100miByDriving,
          });
          logger.debug(`Updated energy_consumption_100mile_by_driving: ${energyConsumption100miByDriving} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped energy_consumption_100mile_by_driving: value unchanged (${energyConsumption100miByDriving}) for VIN ${vin}`);
        }
      }
      if (consumptionEnergyConsumptionMiFeature) {
        if (shouldUpdateFeature(consumptionEnergyConsumptionMiFeature, energyConsumptionMi)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: consumptionEnergyConsumptionMiFeature.external_id,
            state: energyConsumptionMi,
          });
          logger.debug(`Updated energy_consumption_mile: ${energyConsumptionMi} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped energy_consumption_mile: value unchanged (${energyConsumptionMi}) for VIN ${vin}`);
        }
      }
      if (consumptionEnergyConsumptionMiByDrivingFeature) {
        if (shouldUpdateFeature(consumptionEnergyConsumptionMiByDrivingFeature, energyConsumptionMiByDriving)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: consumptionEnergyConsumptionMiByDrivingFeature.external_id,
            state: energyConsumptionMiByDriving,
          });
          logger.debug(`Updated energy_consumption_mile_by_driving: ${energyConsumptionMiByDriving} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped energy_consumption_mile_by_driving: value unchanged (${energyConsumptionMiByDriving}) for VIN ${vin}`);
        }
      }
      if (consumptionEnergyEfficiencyFeature) {
        if (shouldUpdateFeature(consumptionEnergyEfficiencyFeature, energyEfficiency)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: consumptionEnergyEfficiencyFeature.external_id,
            state: energyEfficiency,
          });
          logger.debug(`Updated energy_efficiency: ${energyEfficiency} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped energy_efficiency: value unchanged (${energyEfficiency}) for VIN ${vin}`);
        }
      }
      if (consumptionEnergyEfficiencyByDrivingFeature) {
        if (shouldUpdateFeature(consumptionEnergyEfficiencyByDrivingFeature, energyEfficiencyByDriving)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: consumptionEnergyEfficiencyByDrivingFeature.external_id,
            state: energyEfficiencyByDriving,
          });
          logger.debug(`Updated energy_efficiency_by_driving: ${energyEfficiencyByDriving} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped energy_efficiency_by_driving: value unchanged (${energyEfficiencyByDriving}) for VIN ${vin}`);
        }
      }
    }
  } catch (e) {
    logger.error('deviceGladys Consumption: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateConsumption,
};
