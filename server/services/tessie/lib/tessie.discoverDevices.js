const logger = require('../../../utils/logger');
const { ServiceNotConfiguredError } = require('../../../utils/coreErrors');
const {
  STATUS,
  SUPPORTED_CATEGORY_TYPE,
  EFFICIENCY_PACKAGE_YEAR,
  TRIM_BADGING_TO_VERSION,
  BATTERY_CAPACITY,
} = require('./utils/tessie.constants');

/**
 * @description Discover Tessie vehicles.
 * @returns {Promise} List of discovered vehicles.
 * @example
 * await discoverDevices();
 */
async function discoverDevices() {
  logger.debug('Looking for Tessie vehicles...');
  if (this.status !== STATUS.CONNECTED) {
    await this.saveStatus({ statusType: this.status, message: null });
    throw new ServiceNotConfiguredError('Unable to discover Tessie vehicles until service is not well configured');
  }
  this.discoveredDevices = [];
  await this.saveStatus({ statusType: STATUS.DISCOVERING_DEVICES, message: null });

  let vehicles = [];
  try {
    vehicles = await this.loadVehicles();
    logger.info(`${vehicles.length} Tessie vehicles found`);
  } catch (e) {
    logger.error('Unable to load Tessie vehicles', e);
  }
  if (vehicles.length > 0) {
    this.discoveredDevices = vehicles.map((vehicle) => {
      const carType = vehicle.last_state.vehicle_config?.car_type?.toUpperCase();
      const efficiencyPackage = vehicle.last_state.vehicle_config?.efficiency_package;
      const year = efficiencyPackage?.split(carType)[1]?.match(/\d{4}/)?.[0] || '2024';
      const trimBadging = vehicle.last_state.vehicle_config?.trim_badging;
      const version = trimBadging?.startsWith('P')
        ? 'performance'
        : trimBadging?.startsWith('7') || trimBadging?.startsWith('8') || trimBadging?.startsWith('9')
        ? 'long-range'
        : 'standard';

      const vehicleData = {
        vin: vehicle.vin,
        name: vehicle.last_state.vehicle_state?.vehicle_name,
        model: vehicle.last_state.vehicle_config?.car_type,
        type: vehicle.last_state.vehicle_config?.car_special_type,
        exteriorColor: vehicle.last_state.vehicle_config?.exterior_color,
        year,
        version,
        batteryCapacity: BATTERY_CAPACITY[carType]?.[version?.toUpperCase()]?.BATTERY_CAPACITY || 60,
        batteryRangeMax: BATTERY_CAPACITY[carType]?.[version?.toUpperCase()]?.BATTERY_RANGE || 250,
        isActive: vehicle.is_active,
        vehicle,
      };
      const discoveredDevice = this.convertVehicle(vehicleData);

      return {
        ...discoveredDevice,
        service_id: this.serviceId,
        vehicleData,
      };
    });
    const discoveredDevices = this.discoveredDevices.filter((device) => {
      const existInGladys = this.gladys.stateManager.get('deviceByExternalId', device.external_id);
      return existInGladys === null;
    });
    await this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
    logger.debug(`${discoveredDevices.length} new Tessie vehicles found`);
    return discoveredDevices;
  }
  await this.saveStatus({ statusType: STATUS.CONNECTED, message: null });
  logger.debug('No vehicles found');
  return [];
}

module.exports = {
  discoverDevices,
};
