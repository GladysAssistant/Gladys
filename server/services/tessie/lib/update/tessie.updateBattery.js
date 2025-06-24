const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { BASE_API, API, UPDATE_THRESHOLDS } = require('../utils/tessie.constants');
const shouldUpdateFeature = require('../utils/shouldUpdateFeature');

/**
 * @description Save values of Smart Home Weather Station NAMain Indoor.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} vehicle - Vehicle object coming from the Tessie API.
 * @param {string} vin - Vehicle identifier in Tessie.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateBattery(deviceGladys, vehicle, externalId);
 */
async function updateBattery(deviceGladys, vehicle, vin, externalId) {
  const { charge_state: chargeState, drive_state: driveState } = vehicle;
  
  // Get vehicle battery
  const batteryResponse = await fetch(`${BASE_API}/${vin}${API.VEHICLE_BATTERY}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${this.configuration.apiKey}`,
      'Content-Type': API.HEADER.CONTENT_TYPE,
      Accept: API.HEADER.ACCEPT,
    },
  });
  if (batteryResponse.status !== 200) {
    logger.error(`Error getting battery for vehicle ${vin}:`, await batteryResponse.text());
    return;
  }
  const battery = await batteryResponse.json();

  const batteryLevelFeature = deviceGladys.features.find((f) => f.external_id === `${externalId}:battery_level`);
  const batteryEnergyRemainingFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:battery_energy_remaining`,
  );
  const batteryRangeEstimateFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:battery_range_estimate`,
  );
  const batteryTemperatureMinFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:battery_temperature_min`,
  );
  const batteryTemperatureMaxFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:battery_temperature_max`,
  );
  const batteryVoltageFeature = deviceGladys.features.find((f) => f.external_id === `${externalId}:battery_voltage`);
  const batteryPowerFeature = deviceGladys.features.find((f) => f.external_id === `${externalId}:battery_power`);
  try {
    if (chargeState) {
      if (batteryLevelFeature) {
        const newValue = chargeState.usable_battery_level || battery.battery_level;
        if (shouldUpdateFeature(batteryLevelFeature, newValue, UPDATE_THRESHOLDS.BATTERY)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: batteryLevelFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated battery_level: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped battery_level: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (batteryEnergyRemainingFeature) {
        const newValue = battery.energy_remaining;
        if (shouldUpdateFeature(batteryEnergyRemainingFeature, newValue, UPDATE_THRESHOLDS.BATTERY)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: batteryEnergyRemainingFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated battery_energy_remaining: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped battery_energy_remaining: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (batteryRangeEstimateFeature) {
        const newValue = battery.battery_range;
        if (shouldUpdateFeature(batteryRangeEstimateFeature, newValue, UPDATE_THRESHOLDS.BATTERY)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: batteryRangeEstimateFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated battery_range_estimate: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped battery_range_estimate: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (batteryPowerFeature) {
        const newValue = driveState.power;
        if (shouldUpdateFeature(batteryPowerFeature, newValue, UPDATE_THRESHOLDS.BATTERY)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: batteryPowerFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated battery_power: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped battery_power: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (batteryTemperatureMinFeature) {
        const newValue = battery.module_temp_min;
        if (shouldUpdateFeature(batteryTemperatureMinFeature, newValue, UPDATE_THRESHOLDS.BATTERY)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: batteryTemperatureMinFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated battery_temperature_min: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped battery_temperature_min: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (batteryTemperatureMaxFeature) {
        const newValue = battery.module_temp_max;
        if (shouldUpdateFeature(batteryTemperatureMaxFeature, newValue, UPDATE_THRESHOLDS.BATTERY)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: batteryTemperatureMaxFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated battery_temperature_max: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped battery_temperature_max: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (batteryVoltageFeature) {
        const newValue = battery.pack_voltage;
        if (shouldUpdateFeature(batteryVoltageFeature, newValue, UPDATE_THRESHOLDS.BATTERY)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: batteryVoltageFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated battery_voltage: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped battery_voltage: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
    }
  } catch (e) {
    logger.error('deviceGladys Battery: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateBattery,
};
