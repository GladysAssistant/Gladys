const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');

module.exports = {
  type: 'numeric',
  feature: {
    min: 0,
    max: 10000,
  },
  names: {
    battery: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.BATTERY,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        min: 0,
        max: 100,
      },
    },
    brightness: {
      types: {
        light: {
          category: DEVICE_FEATURE_CATEGORIES.LIGHT,
          type: DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS,
          min: 0,
          max: 255,
        },
      },
    },
    co2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PPM,
      },
    },
    color_temp: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE,
        min: 150,
        max: 500,
      },
    },
    /*
    confort_temperature: {
      feature: {
      },
    },
    */
    current: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.CURRENT,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
        min: 0,
        max: 1000,
      },
    },
    current_phase_b: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.CURRENT,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
        min: 0,
        max: 1000,
      },
    },
    current_phase_c: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.CURRENT,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
        min: 0,
        max: 1000,
      },
    },
    cpu_temperature: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
        min: -100,
        max: 150,
      },
    },
    device_temperature: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
        min: -100,
        max: 150,
      },
    },
    eco2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PPM,
      },
    },
    energy: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.ENERGY,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
      },
    },
    formaldehyd: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      },
    },
    gas: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      },
    },
    /*
    hue: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.HUE,
        min: 150?,
        max: 500?,
      },
    },
    */
    humidity: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        min: 0,
        max: 100,
      },
    },
    illuminance: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        min: 0,
        max: 10000,
      },
    },
    illuminance_lux: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.LUX,
        min: 0,
        max: 10000,
      },
    },
    local_temperature: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
        min: -100,
        max: 150,
      },
    },
    /*
    position: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.CURTAIN,
        type: DEVICE_FEATURE_TYPES.CURTAIN.POSITION,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        min: 0,
        max: 100,
      },
    },
    */
    power: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.POWER,
        unit: DEVICE_FEATURE_UNITS.WATT,
      },
    },
    pressure: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.PRESSURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.HECTO_PASCAL,
      },
    },
    /*
    saturation: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT,
        type: DEVICE_FEATURE_TYPES.LIGHT.SATURATION,
        min: 150?,
        max: 500?,
      },
    },
    */
    temperature: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
        min: -100,
        max: 150,
      },
    },
    vibration: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.BINARY,
      },
    },
    voltage: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
    },
    voltage_phase_b: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
    },
    voltage_phase_c: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SWITCH,
        type: DEVICE_FEATURE_TYPES.SWITCH.VOLTAGE,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
    },
  },
};
