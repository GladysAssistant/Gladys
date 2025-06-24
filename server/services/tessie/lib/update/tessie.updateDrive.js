const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { BASE_API, API, STATUS, UPDATE_THRESHOLDS } = require('../utils/tessie.constants');
const shouldUpdateFeature = require('../utils/shouldUpdateFeature');

/**
 * @description Save values of Smart Home Weather Station NAMain Indoor.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} vehicle - Vehicle object coming from the Tessie API.
 * @param {string} vin - Vehicle identifier in Tessie.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateDrive(deviceGladys, vehicle, externalId);
 */
async function updateDrive(deviceGladys, vehicle, vin, externalId) {
  const { drive_state: driveState } = vehicle;
  // Get vehicle charges
  let drives = null;
  if (this.stateVehicle === STATUS.VEHICLE_STATE.DRIVING) {
    const queryParams = {
      distance_format: 'mi',
      temperature_format: 'c',
      timezone: 'UTC',
      exclude_origin: 'false',
      exclude_destination: 'false',
      exclude_tags: 'false',
      exclude_driver_profiles: 'false',
      format: 'json',
    };
    const queryString = new URLSearchParams(queryParams).toString();
    const driveResponse = await fetch(`${BASE_API}/${vin}${API.VEHICLE_DRIVES}?${queryString}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${this.configuration.apiKey}`,
        'Content-Type': API.HEADER.CONTENT_TYPE,
        Accept: API.HEADER.ACCEPT,
      },
    });
    if (driveResponse.status !== 200) {
      logger.error(`Error getting drives for vehicle ${vin}:`, await driveResponse.text());
      return;
    }
    drives = await driveResponse.json();
  }

  const driveEnergyConsumptionTotalFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:drive_energy_consumption_total`,
  );
  const driveSpeedFeature = deviceGladys.features.find((f) => f.external_id === `${externalId}:speed`);
  const lastDriveEnergyConsumptionFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:last_drive_energy_consumption`,
  );
  const lastDriveDistanceFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:last_drive_distance`,
  );
  const lastDriveAverageSpeedFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:last_drive_average_speed`,
  );
  const lastDriveMaxSpeedFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:last_drive_max_speed`,
  );
  const lastDriveAverageInsideTemperatureFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:last_drive_average_inside_temperature`,
  );
  const lastDriveAverageOutsideTemperatureFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:last_drive_average_outside_temperature`,
  );
  const lastDriveStartingBatteryFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:last_drive_starting_battery`,
  );
  const lastDriveEndingBatteryFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:last_drive_ending_battery`,
  );

  try {

    if (driveState) {
      if (driveSpeedFeature) {
        if (shouldUpdateFeature(driveSpeedFeature, driveState.speed, UPDATE_THRESHOLDS.DRIVE)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: driveSpeedFeature.external_id,
            state: driveState.speed,
          });
          logger.debug(`Updated speed: ${driveState.speed} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped speed: value unchanged (${driveState.speed}) for VIN ${vin}`);
        }
      }
    }

    // Update last drive features
    if (drives) {
      let lastDrive = null;
      let totalDriveEnergyConsumption = 0;
      if (drives.results.length > 0) {
        lastDrive = drives.results[0];

        drives.results.forEach((drive) => {
          totalDriveEnergyConsumption += drive.energy_used;
        });
      } 
      if (driveEnergyConsumptionTotalFeature) {
        if (shouldUpdateFeature(driveEnergyConsumptionTotalFeature, totalDriveEnergyConsumption, UPDATE_THRESHOLDS.DRIVE)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: driveEnergyConsumptionTotalFeature.external_id,
            state: totalDriveEnergyConsumption,
          });
          logger.debug(`Updated drive_energy_consumption_total: ${totalDriveEnergyConsumption} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped drive_energy_consumption_total: value unchanged (${totalDriveEnergyConsumption}) for VIN ${vin}`);
        }
      }
      if (lastDrive && lastDrive.odometer_distance > 0) {
        if (lastDriveEnergyConsumptionFeature) {
          if (shouldUpdateFeature(lastDriveEnergyConsumptionFeature, lastDrive.energy_used)) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: lastDriveEnergyConsumptionFeature.external_id,
              state: lastDrive.energy_used,
            });
            logger.debug(`Updated last_drive_energy_consumption: ${lastDrive.energy_used} for VIN ${vin}`);
          } else {
            logger.debug(`Skipped last_drive_energy_consumption: value unchanged (${lastDrive.energy_used}) for VIN ${vin}`);
          }
        }
        if (lastDriveDistanceFeature) {
          if (shouldUpdateFeature(lastDriveDistanceFeature, lastDrive.odometer_distance)) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: lastDriveDistanceFeature.external_id,
              state: lastDrive.odometer_distance,
            });
            logger.debug(`Updated last_drive_distance: ${lastDrive.odometer_distance} for VIN ${vin}`);
          } else {
            logger.debug(`Skipped last_drive_distance: value unchanged (${lastDrive.odometer_distance}) for VIN ${vin}`);
          }
        }
        if (lastDriveAverageSpeedFeature) {
          if (shouldUpdateFeature(lastDriveAverageSpeedFeature, lastDrive.average_speed)) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: lastDriveAverageSpeedFeature.external_id,
              state: lastDrive.average_speed,
            });
            logger.debug(`Updated last_drive_average_speed: ${lastDrive.average_speed} for VIN ${vin}`);
          } else {
            logger.debug(`Skipped last_drive_average_speed: value unchanged (${lastDrive.average_speed}) for VIN ${vin}`);
          }
        }
        if (lastDriveMaxSpeedFeature) {
          if (shouldUpdateFeature(lastDriveMaxSpeedFeature, lastDrive.max_speed)) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: lastDriveMaxSpeedFeature.external_id,
              state: lastDrive.max_speed,
            });
            logger.debug(`Updated last_drive_max_speed: ${lastDrive.max_speed} for VIN ${vin}`);
          } else {
            logger.debug(`Skipped last_drive_max_speed: value unchanged (${lastDrive.max_speed}) for VIN ${vin}`);
          }
        }
        if (lastDriveAverageInsideTemperatureFeature) {
          if (shouldUpdateFeature(lastDriveAverageInsideTemperatureFeature, lastDrive.average_inside_temperature)) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: lastDriveAverageInsideTemperatureFeature.external_id,
              state: lastDrive.average_inside_temperature,
            });
            logger.debug(`Updated last_drive_average_inside_temperature: ${lastDrive.average_inside_temperature} for VIN ${vin}`);
          } else {
            logger.debug(`Skipped last_drive_average_inside_temperature: value unchanged (${lastDrive.average_inside_temperature}) for VIN ${vin}`);
          }
        }
        if (lastDriveAverageOutsideTemperatureFeature) {
          if (shouldUpdateFeature(lastDriveAverageOutsideTemperatureFeature, lastDrive.average_outside_temperature)) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: lastDriveAverageOutsideTemperatureFeature.external_id,
              state: lastDrive.average_outside_temperature,
            });
            logger.debug(`Updated last_drive_average_outside_temperature: ${lastDrive.average_outside_temperature} for VIN ${vin}`);
          } else {
            logger.debug(`Skipped last_drive_average_outside_temperature: value unchanged (${lastDrive.average_outside_temperature}) for VIN ${vin}`);
          }
        }
        if (lastDriveStartingBatteryFeature) {
          if (shouldUpdateFeature(lastDriveStartingBatteryFeature, lastDrive.starting_battery)) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: lastDriveStartingBatteryFeature.external_id,
              state: lastDrive.starting_battery,
            });
            logger.debug(`Updated last_drive_starting_battery: ${lastDrive.starting_battery} for VIN ${vin}`);
          } else {
            logger.debug(`Skipped last_drive_starting_battery: value unchanged (${lastDrive.starting_battery}) for VIN ${vin}`);
          }
        }
        if (lastDriveEndingBatteryFeature) {
          if (shouldUpdateFeature(lastDriveEndingBatteryFeature, lastDrive.ending_battery)) {
            this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
              device_feature_external_id: lastDriveEndingBatteryFeature.external_id,
              state: lastDrive.ending_battery,
            });
            logger.debug(`Updated last_drive_ending_battery: ${lastDrive.ending_battery} for VIN ${vin}`);
          } else {
            logger.debug(`Skipped last_drive_ending_battery: value unchanged (${lastDrive.ending_battery}) for VIN ${vin}`);
          }
        }
      }
    }
  } catch (e) {
    logger.error('deviceGladys Drive: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateDrive,
};
