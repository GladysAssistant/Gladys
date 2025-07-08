const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
} = require('../../../../utils/constants');
const logger = require('../../../../utils/logger');
const { SUPPORTED_MODULE_TYPE, PARAMS } = require('../utils/tessie.constants');
const { buildFeatureBattery } = require('./tessie.buildFeaturesBattery');
const { buildFeatureCharge } = require('./tessie.buildFeaturesCharge');
const { buildFeatureClimate } = require('./tessie.buildFeaturesClimate');
const { buildFeatureCommand } = require('./tessie.buildFeaturesCommand');
const { buildFeatureConsumption } = require('./tessie.buildFeaturesConsumption');
const { buildFeatureDrive } = require('./tessie.buildFeaturesDrive');
const { buildFeatureState } = require('./tessie.buildFeaturesState');

/**
 * @description Convert a Tessie vehicle to Gladys device format.
 * @param {object} vehicleData - The vehicle data from Tessie API.
 * @returns {object} The converted device.
 * @example
 * convertVehicle(vehicleData);
 */
function convertVehicle(vehicleData) {
  logger.debug(`Converting Tessie vehicle ${vehicleData.id} to Gladys device format`);
  const {
    vin,
    name,
    model: carModel,
    type,
    exteriorColor,
    year,
    version,
    batteryCapacity,
    batteryRangeMax,
    vehicle,
  } = vehicleData;

  const model = `tesla-${carModel}-${exteriorColor?.toLowerCase() || 'unknown'}`;
  const device = {
    name,
    external_id: `tessie:${vin}`,
    selector: `tessie-${vin}`,
    model,
    features: [],
    params: [
      {
        name: PARAMS.VEHICLE_VIN,
        value: vehicle.vin,
      },
      {
        name: PARAMS.VEHICLE_VERSION,
        value: version,
      },
    ],
  };

  // Add features based on the vehicle state
  if (vehicle.last_state) {
    const {
      charge_state: chargeState,
      drive_state: driveState,
      climate_state: climateState,
      vehicle_state: vehicleState,
    } = vehicle.last_state;

    // Battery features
    const batteryFeatures = buildFeatureBattery(
      `tessie:${vin}`,
      'ELECTRICAL_VEHICLE_BATTERY',
      batteryCapacity,
      batteryRangeMax,
      chargeState,
      driveState,
    );

    // Charging state
    const chargeFeatures = buildFeatureCharge(`tessie:${vin}`, 'ELECTRICAL_VEHICLE_CHARGE', chargeState);

    // Climate features
    const climateFeatures = buildFeatureClimate(`tessie:${vin}`, 'ELECTRICAL_VEHICLE_CLIMATE', climateState);

    // Command features
    const commandFeatures = buildFeatureCommand(`tessie:${vin}`, 'ELECTRICAL_VEHICLE_COMMAND', vehicleState);

    // Drive features
    const driveFeatures = buildFeatureDrive(`tessie:${vin}`, 'ELECTRICAL_VEHICLE_DRIVE', driveState);

    // Consumption features
    const consumptionFeatures = buildFeatureConsumption(`tessie:${vin}`, 'ELECTRICAL_VEHICLE_CONSUMPTION');

    // Vehicle state
    const vehicleStateFeatures = buildFeatureState(`tessie:${vin}`, 'ELECTRICAL_VEHICLE_STATE', vehicle.last_state);

    device.features.push(
      ...batteryFeatures,
      ...chargeFeatures,
      ...climateFeatures,
      ...commandFeatures,
      ...driveFeatures,
      ...consumptionFeatures,
      ...vehicleStateFeatures,
    );
  }

  return device;
}

module.exports = {
  convertVehicle,
};
