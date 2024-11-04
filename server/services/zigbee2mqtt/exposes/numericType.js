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
    duration: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.DURATION,
        type: DEVICE_FEATURE_TYPES.DURATION.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.SECONDS,
      },
    },
    battery: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.BATTERY,
        type: DEVICE_FEATURE_TYPES.SENSOR.INTEGER,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        min: 0,
        max: 100,
      },
    },
    battpercentage: {
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
    current_heating_setpoint: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        min: 5,
        max: 40,
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
    illuminance: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
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
    occupied_cooling_setpoint: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        min: 5,
        max: 40,
      },
    },
    occupied_heating_setpoint: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        min: 5,
        max: 40,
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
    unoccupied_cooling_setpoint: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        min: 5,
        max: 40,
      },
    },
    unoccupied_heating_setpoint: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.THERMOSTAT,
        type: DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE,
        min: 5,
        max: 40,
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
    EAST: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EAST,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EAIT: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EAIT,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASF01: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF01,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASF02: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF02,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASF03: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF03,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASF04: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF04,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASF05: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF05,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASF06: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF06,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASF07: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF07,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASF08: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF08,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASF09: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF09,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASF10: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASF10,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    PREF: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.PREF,
        unit: DEVICE_FEATURE_UNITS.KILOVOLT_AMPERE,
      },
    },
    PCOUP: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.PCOUP,
        unit: DEVICE_FEATURE_UNITS.KILOVOLT_AMPERE,
      },
    },
    VTIC: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.VTIC,
      },
    },
    CCASN: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.CCASN,
        unit: DEVICE_FEATURE_UNITS.WATT,
      },
    },
    'CCASN-1': {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.CCASN_1,
        unit: DEVICE_FEATURE_UNITS.WATT,
      },
    },
    UMOY1: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY1,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
    },
    UMOY2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY2,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
    },
    UMOY3: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.UMOY2,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
    },
    ERQ1: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ1,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE_REACTIVE,
      },
    },
    ERQ2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ2,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE_REACTIVE,
      },
    },
    ERQ3: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ3,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE_REACTIVE,
      },
    },
    ERQ4: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.ERQ4,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE_REACTIVE,
      },
    },
    IRMS1: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.IRMS1,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    IRMS2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.IRMS2,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    IRMS3: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.IRMS3,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    URMS1: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.URMS1,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
    },
    URMS2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.URMS2,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
    },
    URMS3: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.URMS3,
        unit: DEVICE_FEATURE_UNITS.VOLT,
      },
    },
    EASD01: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD01,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASD02: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD02,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASD03: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD03,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    EASD04: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.EASD04,
        unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR,
        min: 0,
        max: 1000000,
      },
    },
    NTARF: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.NTARF,
      },
    },
    CCAIN: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.CCAIN,
        unit: DEVICE_FEATURE_UNITS.WATT,
      },
    },
    'CCAIN-1': {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.CCAIN_1,
        unit: DEVICE_FEATURE_UNITS.WATT,
      },
    },
    SINSTI: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTI,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    SMAXIN: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXIN,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    'SMAXIN-1': {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXIN_1,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    RELAIS: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.BINARY,
      },
    },
    SMAXN: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    SMAXN2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN2,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    SMAXN3: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN3,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    SINSTS: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    SINSTS2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS2,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    SINSTS3: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SINSTS3,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    'SMAXN-1': {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN_1,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    'SMAXN2-1': {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN2_1,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    'SMAXN3-1': {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.SMAXN3_1,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
      },
    },
    HHPHC: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.HHPHC,
      },
    },
    IMAX: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    IMAX2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX2,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    IMAX3: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.IMAX3,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    ADPS: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.ADPS,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    ADIR1: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.ADIR1,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    ADIR2: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.ADIR2,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
    ADIR3: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.TELEINFORMATION,
        type: DEVICE_FEATURE_TYPES.TELEINFORMATION.ADIR3,
        unit: DEVICE_FEATURE_UNITS.AMPERE,
      },
    },
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
    PMAX: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.WATT,
      },
    },
    PAPP: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.ENERGY_SENSOR,
        type: DEVICE_FEATURE_TYPES.ENERGY_SENSOR.POWER,
        unit: DEVICE_FEATURE_UNITS.VOLT_AMPERE,
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
    voc_index: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.VOC_INDEX_SENSOR,
        type: DEVICE_FEATURE_TYPES.VOC_INDEX_SENSOR.INTEGER,
        min: 1,
        max: 500,
      },
    },
    soil_moisture: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.SOIL_MOISTURE_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.PERCENT,
        min: 0,
        max: 100,
      },
    },
    pm25: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.PM25_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER,
        min: 0,
        max: 999,
      },
    },
    formaldehyd: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.FORMALDEHYD_SENSOR,
        type: DEVICE_FEATURE_TYPES.SENSOR.DECIMAL,
        unit: DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER,
        min: 0,
        max: 1000000,
      },
    },
    angle_x: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR,
        type: DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.ANGLE_X,
        unit: DEVICE_FEATURE_UNITS.DEGREE,
        min: -90,
        max: 90,
      },
    },
    angle_y: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR,
        type: DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.ANGLE_Y,
        unit: DEVICE_FEATURE_UNITS.DEGREE,
        min: -90,
        max: 90,
      },
    },
    angle_z: {
      feature: {
        category: DEVICE_FEATURE_CATEGORIES.VIBRATION_SENSOR,
        type: DEVICE_FEATURE_TYPES.VIBRATION_SENSOR.ANGLE_Z,
        unit: DEVICE_FEATURE_UNITS.DEGREE,
        min: -90,
        max: 90,
      },
    },
  },
};
