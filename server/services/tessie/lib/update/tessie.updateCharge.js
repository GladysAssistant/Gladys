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
async function updateCharge(deviceGladys, vehicle, vin, externalId) {
  const { charge_state: chargeState } = vehicle;

  // Get vehicle charges
  const queryParams = {
    distance_format: 'km',
    format: 'json',
    superchargers_only: 'false',
    exclude_origin: 'false',
    timezone: 'UTC',
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
    if (charges.length > 0) {
      lastCharge = charges[0];

      charges.forEach((charge) => {
        totalChargeEnergyAdded += charge.energy_added;
        totalChargeEnergyConsumption += charge.energy_consumption;
      });
    }
    if (chargeState) {
      if (chargeCurrentFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: chargeCurrentFeature.external_id,
          state: chargeState.charger_actual_current,
        });
      }
      if (chargeEnergyAddedTotalFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: chargeEnergyAddedTotalFeature.external_id,
          state: totalChargeEnergyAdded,
        });
      }
      if (chargeEnergyConsumptionTotalFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: chargeEnergyConsumptionTotalFeature.external_id,
          state: totalChargeEnergyConsumption,
        });
      }
      if (chargeOnStateFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: chargeOnStateFeature.external_id,
          state: chargeState.charging_state === 'Charging' ? 1 : 0,
        });
      }
      if (chargePowerFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: chargePowerFeature.external_id,
          state: chargeState.charger_power,
        });
      }
      if (chargeVoltageFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: chargeVoltageFeature.external_id,
          state: chargeState.charger_voltage,
        });
      }
      if (chargeLastChargeEnergyAddedFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: chargeLastChargeEnergyAddedFeature.external_id,
          state: lastCharge.energy_added,
        });
      }
      if (chargeLastChargeEnergyConsumptionFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: chargeLastChargeEnergyConsumptionFeature.external_id,
          state: lastCharge.energy_consumption,
        });
      }
      if (chargePluggedFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: chargePluggedFeature.external_id,
          state: chargeState.charging_state !== 'Disconnected' ? 1 : 0,
        });
      }
      if (chargeTargetChargeLimitFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: chargeTargetChargeLimitFeature.external_id,
          state: chargeState.charge_limit_soc,
        });
      }
      if (chargeTargetCurrentFeature) {
        this.gladys.event.emit(EVENTS.DEVICE.NEW_STATE, {
          device_feature_external_id: chargeTargetCurrentFeature.external_id,
          state: chargeState.charge_current_request,
        });
      }
    }
  } catch (e) {
    logger.error('deviceGladys Charge: ', deviceGladys.name, 'error: ', e);
  }
}

module.exports = {
  updateCharge,
};
