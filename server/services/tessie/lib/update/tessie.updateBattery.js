const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { BASE_API, API } = require('../utils/tessie.constants');

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
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: batteryLevelFeature.external_id,
          state: chargeState.usable_battery_level || battery.battery_level,
        });
      }
      if (batteryEnergyRemainingFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: batteryEnergyRemainingFeature.external_id,
          state: battery.energy_remaining,
        });
      }
      if (batteryRangeEstimateFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: batteryRangeEstimateFeature.external_id,
          state: battery.battery_range,
        });
      }
      if (batteryPowerFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: batteryPowerFeature.external_id,
          state: driveState.power,
        });
      }
      if (batteryTemperatureMinFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: batteryTemperatureMinFeature.external_id,
          state: battery.module_temp_min,
        });
      }
      if (batteryTemperatureMaxFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: batteryTemperatureMaxFeature.external_id,
          state: battery.module_temp_max,
        });
      }
      if (batteryVoltageFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: batteryVoltageFeature.external_id,
          state: battery.pack_voltage,
        });
      }
    }
  } catch (e) {
    logger.error('deviceGladys Battery: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateBattery,
};
