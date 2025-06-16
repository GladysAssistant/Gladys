const logger = require('../../../utils/logger');
const { SUPPORTED_MODULE_TYPE } = require('./utils/tessie.constants');

/**
 * @description Convert a Tessie vehicle to Gladys device format.
 * @param {object} vehicle - The vehicle data from Tessie API.
 * @returns {object} The converted device.
 * @example
 * convertVehicle(vehicle);
 */
function convertVehicle(vehicle) {
    logger.debug(`Converting Tessie vehicle ${vehicle.id} to Gladys device format`);

    const carType = vehicle.last_state.vehicle_config?.car_type;
    const exteriorColor = vehicle.last_state.vehicle_config?.exterior_color?.toLowerCase();
    const carSpecialType = vehicle.last_state.vehicle_config?.car_special_type;
    const model = `tesla-${carType}_${carSpecialType}-${exteriorColor}`;
    const device = {
        name: vehicle.display_name || `Tesla ${vehicle.model}`,
        external_id: `tessie:${vehicle.vin}`,
        selector: `tessie-${vehicle.vin}`,
        model,
        features: [],
        params: [
            {
                name: 'vehicle_id',
                value: vehicle.id,
            },
            {
                name: 'vin',
                value: vehicle.vin,
            },
        ],
    };

    // Ajouter les features basées sur l'état du véhicule
    if (vehicle.state) {
        // État de la batterie
        device.features.push({
            name: 'Battery Level',
            type: 'battery',
            external_id: `tessie:${vehicle.id}:battery`,
            selector: `tessie-${vehicle.id}-battery`,
            unit: 'percent',
            min: 0,
            max: 100,
            value: vehicle.state.battery_level,
        });

        // État de charge
        device.features.push({
            name: 'Charging State',
            type: 'binary',
            external_id: `tessie:${vehicle.id}:charging`,
            selector: `tessie-${vehicle.id}-charging`,
            value: vehicle.state.charging_state === 'Charging' ? 1 : 0,
        });

        // Température intérieure
        device.features.push({
            name: 'Inside Temperature',
            type: 'temperature',
            external_id: `tessie:${vehicle.id}:inside_temp`,
            selector: `tessie-${vehicle.id}-inside-temp`,
            unit: 'celsius',
            value: vehicle.state.inside_temp,
        });

        // Température extérieure
        device.features.push({
            name: 'Outside Temperature',
            type: 'temperature',
            external_id: `tessie:${vehicle.id}:outside_temp`,
            selector: `tessie-${vehicle.id}-outside-temp`,
            unit: 'celsius',
            value: vehicle.state.outside_temp,
        });

        // État du véhicule
        device.features.push({
            name: 'Vehicle State',
            type: 'enum',
            external_id: `tessie:${vehicle.id}:state`,
            selector: `tessie-${vehicle.id}-state`,
            values: ['online', 'offline', 'asleep'],
            value: vehicle.state.state,
        });
    }

    return device;
}

module.exports = {
    convertVehicle,
}; 