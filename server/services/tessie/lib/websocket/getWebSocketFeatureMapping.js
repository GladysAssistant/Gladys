function getWebSocketFeatureMapping(key) {
    const mappings = {
        // Battery features
        'Soc': {
            featureId: 'battery_level',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 1
        },
        'BatteryLevel': {
            featureId: 'battery_level',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 1
        },
        'EstBatteryRange': {
            featureId: 'battery_range_estimate',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 0
        },
        'EnergyRemaining': {
            featureId: 'battery_energy_remaining',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 2
        },
        'PackVoltage': {
            featureId: 'battery_voltage',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 2
        },
        'PackCurrent': {
            featureId: 'battery_current',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 2
        },
        'battery_power': {
            featureId: 'battery_power',
            type: 'calculated_power',
            decimalPlaces: 2
        }, // Calculé à partir de PackVoltage × PackCurrent
        'ModuleTempMin': {
            featureId: 'battery_temperature_min',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 1
        },
        'ModuleTempMax': {
            featureId: 'battery_temperature_max',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 1
        },
        'NumModuleTempMin': {
            featureId: 'battery_temperature_min',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 1
        },
        'NumModuleTempMax': {
            featureId: 'battery_temperature_max',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 1
        },

        // Climate features
        'HvacACEnabled': {
            featureId: 'climate_on',
            type: 'boolean',
            valueProperty: 'boolValue'
        },
        'HvacPower': {
            featureId: 'climate_on',
            type: 'boolean',
            valueProperty: 'hvacPowerValue',
            enumMapping: {
                'HvacPowerStateOn': 1,
                'HvacPowerStateOff': 0
            }
        },
        'HvacFanStatus': {
            featureId: 'climate_fan_status',
            type: 'number',
            valueProperty: 'intValue'
        },
        'InsideTemp': {
            featureId: 'indoor_temperature',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 1
        },
        'OutsideTemp': {
            featureId: 'outside_temperature',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 1
        },
        'HvacLeftTemperatureRequest': {
            featureId: 'target_temperature',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 1
        },

        // Charging features
        'ACChargingPower': {
            featureId: 'charge_power',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 2
        },
        'DCChargingPower': {
            featureId: 'charge_power',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 2
        },
        'ChargerVoltage': {
            featureId: 'charge_voltage',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 2
        },
        'ChargeAmps': {
            featureId: 'charge_current',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 2
        },
        'Location': {
            featureId: 'location',
            type: 'location',
            valueProperty: 'locationValue'
        },

        // State features
        'door_value': {
            featureId: 'door_state',
            type: 'door_state',
            valueProperty: 'doorValue'
        }, // Door features - mapped individually from door_value
        'Odometer': {
            featureId: 'odometer',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 0
        },
        'TpmsPressureFl': {
            featureId: 'tpms_pressure_fl',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 1
        },
        'TpmsPressureFr': {
            featureId: 'tpms_pressure_fr',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 1
        },
        'TpmsPressureRl': {
            featureId: 'tpms_pressure_rl',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 1
        },
        'TpmsPressureRr': {
            featureId: 'tpms_pressure_rr',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 1
        },
        'FdWindow': {
            featureId: 'window_fd_opened',
            type: 'boolean',
            valueProperty: 'boolValue'
        },
        'FpWindow': {
            featureId: 'window_fp_opened',
            type: 'boolean',
            valueProperty: 'boolValue'
        },
        'RdWindow': {
            featureId: 'window_rd_opened',
            type: 'boolean',
            valueProperty: 'boolValue'
        },
        'RpWindow': {
            featureId: 'window_rp_opened',
            type: 'boolean',
            valueProperty: 'boolValue'
        },
        'VehicleSpeed': {
            featureId: 'speed',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 0
        },
        'Power': {
            featureId: 'power',
            type: 'number',
            valueProperty: 'doubleValue',
            decimalPlaces: 2
        },
        // 'Temperature': { featureId: 'temperature', type: 'number' },
        // 'ChargeState': { featureId: 'charge_state', type: 'string' },
    };
    return mappings[key] || null;
}

module.exports = getWebSocketFeatureMapping; 