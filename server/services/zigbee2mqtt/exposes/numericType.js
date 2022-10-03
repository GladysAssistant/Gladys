const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, DEVICE_FEATURE_UNITS } = require('../../../utils/constants');

module.exports = {
  type: 'numeric',
  writeValue: (expose, value) => {
    return value;
  },
  readValue: (expose, value) => {
    if (expose.name === 'linkquality') {
      return Math.round((value * 5) / 255);
    }

    return value;
  },
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
        category: DEVICE_FEATURE_CATEGORIES.DEVICE_TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
        min: -100,
        max: 150,
      },
    },
    device_temperature: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.DEVICE_TEMPERATURE_SENSOR,
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
    gas: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
      },
    },
    humidity: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        min: 0,
        max: 100,
      },
    },
    illuminance_lux: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.LUX,
        min: 0,
        max: 100000,
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
    linkquality: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SIGNAL,
        type: DEVICE_FEATURE_TYPES.SIGNAL.QUALITY,
        min: 0,
        max: 5,
        forceOverride: true,
      },
    },
    position: {
      types: {
        cover: {
          category: DEVICE_FEATURE_CATEGORIES.SHUTTER,
          type: DEVICE_FEATURE_TYPES.SHUTTER.POSITION,
          unit: DEVICE_FEATURE_UNITS.PERCENT,
        },
      },
    },
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
    temperature: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.CELSIUS,
        min: -100,
        max: 150,
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
    // Lixee TIC Device
    BASE: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    ISOUSC: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
        min: 0,
        max: 1000000,
      },
    },
    HCHC: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    HCHP: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    BBRHCJW: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    BBRHPJW: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    BBRHCJR: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    BBRHPJR: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASF07: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASF08: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASF09: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASF10: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    IINST: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    IINST2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    IINST3: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    IMAX: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    IMAX2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    IMAX3: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    PMAX: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.WATT,
      },
    },
    SMAXN: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    SMAXN2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    SMAXN3: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    'SMAXN-1': {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    'SMAXN2-1': {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    'SMAXN3-1': {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    PAPP: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    SINSTS: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    SINSTS2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    SINSTS3: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    EASD01: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASD02: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASD03: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASD04: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    URMS1: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
    },
    URMS2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
    },
    URMS3: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
    },
    SINSTI: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    SMAXIN: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    'SMAXIN-1': {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    CCAIN: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.WATT,
      },
    },
    'CCAIN-1': {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.WATT,
      },
    },
    CCASN: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.WATT,
      },
    },
    'CCASN-1': {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.WATT,
      },
    },
    UMOY1: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
    },
    UMOY2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
    },
    UMOY3: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.VOLTAGE,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
    },
    ERQ2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE_REACTIVE,
      },
    },
    ERQ3: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE_REACTIVE,
      },
    },
    ERQ4: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE_REACTIVE,
      },
    },
    ERQ1: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE_REACTIVE,
      },
    },
    EAIT: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
      },
    },
    NTARF: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
      },
    },
    IRMS1: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    PREF: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
        unit: DEVICE_FEATURE_UNITS.KILOVOLT_AMPERE,
      },
    },
    PCOUP: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.CURRENT,
        unit: DEVICE_FEATURE_UNITS.KILOVOLT_AMPERE,
      },
    },
    RELAIS: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
      },
    },
    EAST: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        min: 0,
        max: 1000000,
      },
    },
    EASF01: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        min: 0,
        max: 1000000,
      },
    },
    EASF02: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.INDEX,
        min: 0,
        max: 1000000,
      },
    },
    // End of Lixee TIC device
    voc: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.VOC_SENSOR,
        type: DEVICE_FEATURE_TYPES.VOC_SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PPB,
        min: 0,
        max: 5500,
      },
    },
  },
};
