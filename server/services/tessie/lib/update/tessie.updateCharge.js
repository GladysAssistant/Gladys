const { EVENTS } = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { BASE_API, API } = require('../utils/tessie.constants');
const shouldUpdateFeature = require('../utils/shouldUpdateFeature');

/**
 * @description Save values of Smart Home Weather Station NAMain Indoor.
 * @param {object} deviceGladys - Device object in Gladys.
 * @param {object} vehicle - Vehicle object coming from the Tessie API.
 * @param {string} vin - Vehicle identifier in Tessie.
 * @param {string} externalId - Device identifier in gladys.
 * @example updateCharge(deviceGladys, vehicle, externalId);
 */
async function updateCharge(deviceGladys, vehicle, vin, externalId) {
  const { charge_state: chargeState } = vehicle;

  // Get vehicle charges
  const queryParams = {
    distance_format: 'mi',
    timezone: 'UTC',
    superchargers_only: 'false',
    exclude_origin: 'false',
    format: 'json',
  };
  const queryString = new URLSearchParams(queryParams).toString();
  const chargeResponse = await fetch(`${BASE_API}/${vin}${API.VEHICLE_CHARGING}?${queryString}`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${this.configuration.apiKey}`,
      'Content-Type': API.HEADER.CONTENT_TYPE,
      Accept: API.HEADER.ACCEPT,
    },
  });
  if (chargeResponse.status !== 200) {
    logger.error(`Error getting charge for vehicle ${vin}:`, await chargeResponse.text());
    return;
  }
  const charges = await chargeResponse.json();

  const chargeCurrentFeature = deviceGladys.features.find((f) => f.external_id === `${externalId}:charge_current`);
  const chargeEnergyAddedTotalFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:charge_energy_added_total`,
  );
  const chargeEnergyConsumptionTotalFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:charge_energy_consumption_total`,
  );
  const chargeOnStateFeature = deviceGladys.features.find((f) => f.external_id === `${externalId}:charge_on`);
  const chargePowerFeature = deviceGladys.features.find((f) => f.external_id === `${externalId}:charge_power`);
  const chargeVoltageFeature = deviceGladys.features.find((f) => f.external_id === `${externalId}:charge_voltage`);
  const chargeLastChargeEnergyAddedFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:last_charge_energy_added`,
  );
  const chargeLastChargeEnergyConsumptionFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:last_charge_energy_consumption`,
  );
  const chargePluggedFeature = deviceGladys.features.find((f) => f.external_id === `${externalId}:plugged`);
  const chargeTargetChargeLimitFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:target_charge_limit`,
  );
  const chargeTargetCurrentFeature = deviceGladys.features.find(
    (f) => f.external_id === `${externalId}:target_current`,
  );

  try {
    let lastCharge = null;
    let totalChargeEnergyAdded = 0;
    let totalChargeEnergyConsumption = 0;
    if (charges.results.length > 0) {
      lastCharge = charges.results[0];

      charges.results.forEach((charge) => {
        totalChargeEnergyAdded += charge.energy_added;
        totalChargeEnergyConsumption += charge.energy_used;
      });
    }
    if (chargeState) {
      if (chargeCurrentFeature) {
        const newValue = chargeState.charger_actual_current;
        if (shouldUpdateFeature(chargeCurrentFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: chargeCurrentFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated charge_current: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped charge_current: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (chargeEnergyAddedTotalFeature) {
        const newValue = totalChargeEnergyAdded;
        if (shouldUpdateFeature(chargeEnergyAddedTotalFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: chargeEnergyAddedTotalFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated charge_energy_added_total: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped charge_energy_added_total: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (chargeEnergyConsumptionTotalFeature) {
        const newValue = totalChargeEnergyConsumption;
        if (shouldUpdateFeature(chargeEnergyConsumptionTotalFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: chargeEnergyConsumptionTotalFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated charge_energy_consumption_total: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped charge_energy_consumption_total: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (chargeOnStateFeature) {
        const newValue = chargeState.charging_state === 'Charging' ? 1 : 0;
        if (shouldUpdateFeature(chargeOnStateFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: chargeOnStateFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated charge_on: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped charge_on: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (chargePowerFeature) {
        const newValue = chargeState.charger_power;
        if (shouldUpdateFeature(chargePowerFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: chargePowerFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated charge_power: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped charge_power: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (chargeVoltageFeature) {
        const newValue = chargeState.charger_voltage;
        if (shouldUpdateFeature(chargeVoltageFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: chargeVoltageFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated charge_voltage: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped charge_voltage: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (chargeLastChargeEnergyAddedFeature && lastCharge) {
        const newValue = lastCharge.energy_added;
        if (shouldUpdateFeature(chargeLastChargeEnergyAddedFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: chargeLastChargeEnergyAddedFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated last_charge_energy_added: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped last_charge_energy_added: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (chargeLastChargeEnergyConsumptionFeature && lastCharge) {
        const newValue = lastCharge.energy_used;
        if (shouldUpdateFeature(chargeLastChargeEnergyConsumptionFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: chargeLastChargeEnergyConsumptionFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated last_charge_energy_consumption: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped last_charge_energy_consumption: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (chargePluggedFeature) {
        const newValue = chargeState.charging_state !== 'Disconnected' ? 1 : 0;
        if (shouldUpdateFeature(chargePluggedFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: chargePluggedFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated plugged: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped plugged: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (chargeTargetChargeLimitFeature) {
        const newValue = chargeState.charge_limit_soc;
        if (shouldUpdateFeature(chargeTargetChargeLimitFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: chargeTargetChargeLimitFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated target_charge_limit: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped target_charge_limit: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
      if (chargeTargetCurrentFeature) {
        const newValue = chargeState.charge_current_request;
        if (shouldUpdateFeature(chargeTargetCurrentFeature, newValue)) {
          this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
            device_feature_external_id: chargeTargetCurrentFeature.external_id,
            state: newValue,
          });
          logger.debug(`Updated target_current: ${newValue} for VIN ${vin}`);
        } else {
          logger.debug(`Skipped target_current: value unchanged (${newValue}) for VIN ${vin}`);
        }
      }
    }
  } catch (e) {
    logger.error('deviceGladys Charge: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateCharge,
};
