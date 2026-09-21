const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  COVER_STATE,
  LOCK,
  BUTTON_STATUS,
  AC_MODE,
  THERMOSTAT_MODE,
  THERMOSTAT_OPERATING_STATE,
} = require('../../../utils/constants');

const mappings = {
  [DEVICE_FEATURE_CATEGORIES.LIGHT]: {
    service: 'Lightbulb',
    capabilities: {
      [DEVICE_FEATURE_TYPES.LIGHT.BINARY]: {
        characteristics: ['On'],
      },
      [DEVICE_FEATURE_TYPES.LIGHT.BRIGHTNESS]: {
        characteristics: ['Brightness'],
      },
      [DEVICE_FEATURE_TYPES.LIGHT.COLOR]: {
        characteristics: ['Hue', 'Saturation'],
      },
      [DEVICE_FEATURE_TYPES.LIGHT.TEMPERATURE]: {
        characteristics: ['ColorTemperature'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.OPENING_SENSOR]: {
    service: 'ContactSensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: {
        characteristics: ['ContactSensorState'],
        notifDelay: 1000,
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.MOTION_SENSOR]: {
    service: 'MotionSensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: {
        characteristics: ['MotionDetected'],
        notifDelay: 1000,
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.PRESENCE_SENSOR]: {
    service: 'OccupancySensor',
    capabilities: {
      // The push flavour is what lan-manager creates, and despite its name it carries a lasting
      // state rather than an event: the scanner emits 1 when the device answers and 0 when it stops
      // answering, and reads the stored value back before emitting so the same one is not repeated.
      // Gladys and HomeKit agree that 1 means occupied, so the value goes through untouched.
      [DEVICE_FEATURE_TYPES.SENSOR.PUSH]: {
        characteristics: ['OccupancyDetected'],
      },
      [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: {
        characteristics: ['OccupancyDetected'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.LEAK_SENSOR]: {
    service: 'LeakSensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: {
        characteristics: ['LeakDetected'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.LIGHT_SENSOR]: {
    service: 'LightSensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: {
        characteristics: ['CurrentAmbientLightLevel'],
      },
      [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: {
        characteristics: ['CurrentAmbientLightLevel'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SMOKE_SENSOR]: {
    service: 'SmokeSensor',
    capabilities: {
      // HomeKit only knows whether smoke is detected. The decimal flavour some integrations report
      // is a concentration, which has no HomeKit characteristic, so it stays out.
      [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: {
        characteristics: ['SmokeDetected'],
        // No debounce at all: the default five seconds is far too slow for a smoke alarm.
        notifDelay: 0,
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.CO_SENSOR]: {
    service: 'CarbonMonoxideSensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: {
        characteristics: ['CarbonMonoxideDetected'],
      },
      [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: {
        characteristics: ['CarbonMonoxideLevel', 'CarbonMonoxideDetected'],
      },
      [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: {
        characteristics: ['CarbonMonoxideLevel', 'CarbonMonoxideDetected'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.CO2_SENSOR]: {
    service: 'CarbonDioxideSensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: {
        characteristics: ['CarbonDioxideDetected'],
      },
      [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: {
        characteristics: ['CarbonDioxideLevel', 'CarbonDioxideDetected'],
      },
      [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: {
        characteristics: ['CarbonDioxideLevel', 'CarbonDioxideDetected'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR]: {
    service: 'AirQualitySensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.AIRQUALITY_SENSOR.AQI]: {
        characteristics: ['AirQuality'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.PM25_SENSOR]: {
    service: 'AirQualitySensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: {
        characteristics: ['PM2_5Density'],
      },
      [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: {
        characteristics: ['PM2_5Density'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.PM10_SENSOR]: {
    service: 'AirQualitySensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: {
        characteristics: ['PM10Density'],
      },
      [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: {
        characteristics: ['PM10Density'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.NO2_SENSOR]: {
    service: 'AirQualitySensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: {
        characteristics: ['NitrogenDioxideDensity'],
      },
      [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: {
        characteristics: ['NitrogenDioxideDensity'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.O3_SENSOR]: {
    service: 'AirQualitySensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: {
        characteristics: ['OzoneDensity'],
      },
      [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: {
        characteristics: ['OzoneDensity'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SO2_SENSOR]: {
    service: 'AirQualitySensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: {
        characteristics: ['SulphurDioxideDensity'],
      },
      [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: {
        characteristics: ['SulphurDioxideDensity'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.BATTERY]: {
    service: 'Battery',
    capabilities: {
      // Integrations disagree on which type carries a battery percentage: Nuki reports it as a lock
      // integer, most others as a sensor or battery integer. All three mean the same thing here.
      [DEVICE_FEATURE_TYPES.BATTERY.INTEGER]: {
        characteristics: ['BatteryLevel', 'StatusLowBattery'],
      },
      [DEVICE_FEATURE_TYPES.SENSOR.INTEGER]: {
        characteristics: ['BatteryLevel', 'StatusLowBattery'],
      },
      [DEVICE_FEATURE_TYPES.LOCK.INTEGER]: {
        characteristics: ['BatteryLevel', 'StatusLowBattery'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.BATTERY_LOW]: {
    service: 'Battery',
    capabilities: {
      [DEVICE_FEATURE_TYPES.BATTERY_LOW.BINARY]: {
        characteristics: ['StatusLowBattery'],
      },
      [DEVICE_FEATURE_TYPES.SENSOR.BINARY]: {
        characteristics: ['StatusLowBattery'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.BUTTON]: {
    service: 'StatelessProgrammableSwitch',
    capabilities: {
      [DEVICE_FEATURE_TYPES.BUTTON.CLICK]: {
        characteristics: ['ProgrammableSwitchEvent'],
        // A button press is an event, not a state: the default debounce would make HomeKit react
        // seconds after the press, or swallow it entirely.
        notifDelay: 0,
      },
      [DEVICE_FEATURE_TYPES.BUTTON.PUSH]: {
        characteristics: ['ProgrammableSwitchEvent'],
        notifDelay: 0,
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    service: 'Switch',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: {
        characteristics: ['On'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SIREN]: {
    service: 'Switch',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SIREN.BINARY]: {
        characteristics: ['On'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR]: {
    service: 'TemperatureSensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: {
        characteristics: ['CurrentTemperature'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.HUMIDITY_SENSOR]: {
    service: 'HumiditySensor',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL]: {
        characteristics: ['CurrentRelativeHumidity'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.LOCK]: {
    service: 'LockMechanism',
    capabilities: {
      [DEVICE_FEATURE_TYPES.LOCK.BINARY]: {
        characteristics: ['LockTargetState', 'LockCurrentState'],
      },
      [DEVICE_FEATURE_TYPES.LOCK.STATE]: {
        characteristics: ['LockCurrentState', 'LockTargetState'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.FAN]: {
    service: 'Fanv2',
    capabilities: {
      [DEVICE_FEATURE_TYPES.FAN.MODE]: {
        characteristics: ['Active'],
      },
      [DEVICE_FEATURE_TYPES.FAN.PERCENT]: {
        characteristics: ['RotationSpeed', 'Active'],
        mergeReadOnlyTwin: true,
      },
      [DEVICE_FEATURE_TYPES.FAN.SPEED]: {
        characteristics: ['RotationSpeed', 'Active'],
        mergeReadOnlyTwin: true,
      },
      [DEVICE_FEATURE_TYPES.FAN.ROCK_SETTING]: {
        characteristics: ['SwingMode'],
      },
      [DEVICE_FEATURE_TYPES.FAN.AIRFLOW_DIRECTION]: {
        characteristics: ['RotationDirection'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.THERMOSTAT]: {
    service: 'Thermostat',
    capabilities: {
      [DEVICE_FEATURE_TYPES.THERMOSTAT.TARGET_TEMPERATURE]: {
        characteristics: ['TargetTemperature'],
      },
      [DEVICE_FEATURE_TYPES.THERMOSTAT.MODE]: {
        characteristics: ['TargetHeatingCoolingState', 'CurrentHeatingCoolingState'],
      },
      // Read-only: it says what the device is doing, HomeKit has nothing to command there.
      [DEVICE_FEATURE_TYPES.THERMOSTAT.OPERATING_STATE]: {
        characteristics: ['CurrentHeatingCoolingState'],
      },
    },
  },
  // An air conditioner is a HeaterCooler, not a Thermostat: HomeKit gives the former an Active
  // characteristic of its own, so "turn on the air conditioning" is a power command that leaves the
  // mode alone. On a Thermostat the only way to be on is to be in a mode, and Siri picks Auto — an
  // air conditioner told to turn on in summer would start heating. A device carrying thermostat
  // features next to these ones is still a Thermostat, see mergedServiceCategories.
  [DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING]: {
    service: 'HeaterCooler',
    capabilities: {
      // A single setpoint stands behind both thresholds: the Home app shows the heating one in heat
      // mode and the cooling one in cool mode.
      [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.TARGET_TEMPERATURE]: {
        characteristics: ['CoolingThresholdTemperature', 'HeatingThresholdTemperature'],
      },
      [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.MODE]: {
        characteristics: ['TargetHeaterCoolerState', 'CurrentHeaterCoolerState'],
      },
      [DEVICE_FEATURE_TYPES.AIR_CONDITIONING.BINARY]: {
        characteristics: ['Active', 'CurrentHeaterCoolerState'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.SHUTTER]: {
    service: 'WindowCovering',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SHUTTER.POSITION]: {
        characteristics: ['CurrentPosition', 'TargetPosition'],
      },
      [DEVICE_FEATURE_TYPES.SHUTTER.STATE]: {
        characteristics: ['PositionState'],
      },
    },
  },
  [DEVICE_FEATURE_CATEGORIES.CURTAIN]: {
    service: 'WindowCovering',
    capabilities: {
      [DEVICE_FEATURE_TYPES.CURTAIN.POSITION]: {
        characteristics: ['CurrentPosition', 'TargetPosition'],
      },
      [DEVICE_FEATURE_TYPES.CURTAIN.STATE]: {
        characteristics: ['PositionState'],
      },
    },
  },
};

const coverStateMapping = {
  [COVER_STATE.CLOSE]: 0,
  [COVER_STATE.OPEN]: 1,
  [COVER_STATE.STOP]: 2,
};

// HomeKit LockCurrentState has no "moving" value, so a lock in motion is reported as unknown.
const lockStateMapping = {
  [LOCK.STATE.UNLOCKED]: 0, // UNSECURED
  [LOCK.STATE.LOCKED]: 1, // SECURED
  [LOCK.STATE.ACTIVITY]: 3, // UNKNOWN
  [LOCK.STATE.ERROR]: 2, // JAMMED
};

// Values of the HomeKit AirQuality characteristic.
const HOMEKIT_AIR_QUALITY = {
  UNKNOWN: 0,
  EXCELLENT: 1,
  GOOD: 2,
  FAIR: 3,
  INFERIOR: 4,
  POOR: 5,
};

// US EPA air quality index bands, each one mapped to the closest HomeKit air quality level. Gladys
// stores a unitless index without declaring which standard it follows, so a standard has to be
// assumed: the EPA one is what the other HomeKit bridges use. European indices (CAQI, EAQI) would
// bucket differently, and this table is where to adjust if Gladys ever tells them apart.
const airQualityIndexMapping = [
  { maxIndex: 50, airQuality: HOMEKIT_AIR_QUALITY.EXCELLENT },
  { maxIndex: 100, airQuality: HOMEKIT_AIR_QUALITY.GOOD },
  { maxIndex: 150, airQuality: HOMEKIT_AIR_QUALITY.FAIR },
  { maxIndex: 200, airQuality: HOMEKIT_AIR_QUALITY.INFERIOR },
];

// Concentration, in ppm, at or above which HomeKit is told the gas is detected. The comparison is
// inclusive: a sensor sitting exactly on the alarm level is alarming, not safe.
const gasDetectedThresholds = {
  [DEVICE_FEATURE_CATEGORIES.CO_SENSOR]: 25,
  [DEVICE_FEATURE_CATEGORIES.CO2_SENSOR]: 1000,
};

// HomeKit expects particulate densities in µg/m³, while Gladys lets an integration report them in
// milligrams, micrograms or nanograms. Without this conversion a sensor reporting mg/m³ would be
// shown a thousand times too low.
const microgramPerCubicMeterFactors = {
  [DEVICE_FEATURE_UNITS.MILLIGRAM_PER_CUBIC_METER]: 1000,
  [DEVICE_FEATURE_UNITS.MICROGRAM_PER_CUBIC_METER]: 1,
  [DEVICE_FEATURE_UNITS.NANOGRAM_PER_CUBIC_METER]: 0.001,
};

/**
 * @description Convert a particulate concentration to the µg/m³ HomeKit expects.
 * @param {number} value - Concentration reported by Gladys.
 * @param {string} unit - Gladys unit the concentration is expressed in.
 * @returns {number} The concentration in µg/m³.
 * @example
 * toMicrogramPerCubicMeter(0.05, DEVICE_FEATURE_UNITS.MILLIGRAM_PER_CUBIC_METER);
 */
function toMicrogramPerCubicMeter(value, unit) {
  // An integration that declares no unit is assumed to already report µg/m³, which is what the
  // Zigbee and Matter clusters use.
  const factor = microgramPerCubicMeterFactors[unit] === undefined ? 1 : microgramPerCubicMeterFactors[unit];
  return value * factor;
}

/**
 * @description Convert a Gladys air quality index to the HomeKit AirQuality characteristic value.
 * @param {number} airQualityIndex - Air quality index reported by Gladys.
 * @returns {number} HomeKit air quality, from 0 (unknown) to 5 (poor).
 * @example
 * aqiToAirQuality(75);
 */
function aqiToAirQuality(airQualityIndex) {
  if (!Number.isFinite(airQualityIndex) || airQualityIndex < 0) {
    return HOMEKIT_AIR_QUALITY.UNKNOWN;
  }

  const band = airQualityIndexMapping.find(({ maxIndex }) => airQualityIndex <= maxIndex);
  return band ? band.airQuality : HOMEKIT_AIR_QUALITY.POOR;
}

/**
 * @description Keep a raw sensor value inside the bounds accepted by a HomeKit characteristic.
 * Sensor values are already expressed in the unit expected by HomeKit (lux, ppm), so they
 * must be clamped and not rescaled to the Gladys feature min/max.
 * @param {number} value - Raw value read from Gladys.
 * @param {object} props - Props of the HomeKit characteristic receiving the value.
 * @returns {number} Value clamped between the characteristic bounds.
 * @example
 * clampToCharacteristic(150000, { minValue: 0.0001, maxValue: 100000 });
 */
function clampToCharacteristic(value, props = {}) {
  const minValue = props.minValue === undefined ? -Infinity : props.minValue;
  const maxValue = props.maxValue === undefined ? Infinity : props.maxValue;
  return Math.min(maxValue, Math.max(minValue, value));
}

// HomeKit exposes air quality as a single AirQualitySensor service carrying the index and the
// pollutant densities, while Gladys splits them across categories. The first host category present
// on a device owns the service and absorbs the features of the other categories listed here.
const mergedServiceCategories = [
  {
    hosts: [
      DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR,
      DEVICE_FEATURE_CATEGORIES.PM25_SENSOR,
      DEVICE_FEATURE_CATEGORIES.PM10_SENSOR,
      DEVICE_FEATURE_CATEGORIES.NO2_SENSOR,
      DEVICE_FEATURE_CATEGORIES.O3_SENSOR,
      DEVICE_FEATURE_CATEGORIES.SO2_SENSOR,
    ],
    merged: [],
  },
  // Same for the battery: HomeKit shows a single Battery service, while Gladys splits the
  // percentage and the low-battery flag across two categories.
  {
    hosts: [DEVICE_FEATURE_CATEGORIES.BATTERY, DEVICE_FEATURE_CATEGORIES.BATTERY_LOW],
    merged: [],
  },
  // A heating or cooling device is one HomeKit service, while Gladys splits it across the
  // setpoints, the mode, the on/off command and the temperature sensor reading the room. The first
  // host present decides the service: a device with thermostat features is a Thermostat, and its
  // air conditioning features join it (a Matter heat pump declares its heating setpoint as a
  // thermostat and its cooling setpoint and mode as air conditioning); a device with air
  // conditioning features alone is a HeaterCooler.
  {
    hosts: [DEVICE_FEATURE_CATEGORIES.THERMOSTAT, DEVICE_FEATURE_CATEGORIES.AIR_CONDITIONING],
    merged: [DEVICE_FEATURE_CATEGORIES.TEMPERATURE_SENSOR],
  },
];

// Values of the HomeKit TargetHeatingCoolingState characteristic. CurrentHeatingCoolingState uses
// the same values without AUTO.
const HOMEKIT_HEATING_COOLING_STATE = {
  OFF: 0,
  HEAT: 1,
  COOL: 2,
  AUTO: 3,
};

// AC_MODE.DRYING and AC_MODE.FAN have no HomeKit equivalent, they are reported as AUTO.
const acModeToHeatingCoolingState = {
  [AC_MODE.AUTO]: HOMEKIT_HEATING_COOLING_STATE.AUTO,
  [AC_MODE.COOLING]: HOMEKIT_HEATING_COOLING_STATE.COOL,
  [AC_MODE.HEATING]: HOMEKIT_HEATING_COOLING_STATE.HEAT,
  [AC_MODE.DRYING]: HOMEKIT_HEATING_COOLING_STATE.AUTO,
  [AC_MODE.FAN]: HOMEKIT_HEATING_COOLING_STATE.AUTO,
};

const heatingCoolingStateToAcMode = {
  [HOMEKIT_HEATING_COOLING_STATE.HEAT]: AC_MODE.HEATING,
  [HOMEKIT_HEATING_COOLING_STATE.COOL]: AC_MODE.COOLING,
  [HOMEKIT_HEATING_COOLING_STATE.AUTO]: AC_MODE.AUTO,
};

// Values of the HomeKit TargetHeaterCoolerState characteristic. They are not the Thermostat ones:
// there is no off, the device is switched off through Active, and auto is 0 rather than 3.
const HOMEKIT_HEATER_COOLER_STATE = {
  AUTO: 0,
  HEAT: 1,
  COOL: 2,
};

// Values of the HomeKit CurrentHeaterCoolerState characteristic. Unlike CurrentHeatingCoolingState
// it tells a device that is off from one that is on and doing nothing.
const HOMEKIT_CURRENT_HEATER_COOLER_STATE = {
  INACTIVE: 0,
  IDLE: 1,
  HEATING: 2,
  COOLING: 3,
};

// AC_MODE.DRYING and AC_MODE.FAN have no HomeKit equivalent here either, they are reported as AUTO.
const acModeToHeaterCoolerState = {
  [AC_MODE.AUTO]: HOMEKIT_HEATER_COOLER_STATE.AUTO,
  [AC_MODE.COOLING]: HOMEKIT_HEATER_COOLER_STATE.COOL,
  [AC_MODE.HEATING]: HOMEKIT_HEATER_COOLER_STATE.HEAT,
  [AC_MODE.DRYING]: HOMEKIT_HEATER_COOLER_STATE.AUTO,
  [AC_MODE.FAN]: HOMEKIT_HEATER_COOLER_STATE.AUTO,
};

const heaterCoolerStateToAcMode = {
  [HOMEKIT_HEATER_COOLER_STATE.AUTO]: AC_MODE.AUTO,
  [HOMEKIT_HEATER_COOLER_STATE.HEAT]: AC_MODE.HEATING,
  [HOMEKIT_HEATER_COOLER_STATE.COOL]: AC_MODE.COOLING,
};

// Unlike the air conditioning mode, the thermostat mode carries its own off value, so a device
// driven by it needs no separate on/off command to be switched off from the Home app. The two enums
// happen to agree value for value, but they are written out rather than passed through: a change to
// either one has to be a change here, not a mode silently shifting by one.
const thermostatModeToHeatingCoolingState = {
  [THERMOSTAT_MODE.OFF]: HOMEKIT_HEATING_COOLING_STATE.OFF,
  [THERMOSTAT_MODE.HEATING]: HOMEKIT_HEATING_COOLING_STATE.HEAT,
  [THERMOSTAT_MODE.COOLING]: HOMEKIT_HEATING_COOLING_STATE.COOL,
  [THERMOSTAT_MODE.AUTO]: HOMEKIT_HEATING_COOLING_STATE.AUTO,
};

const heatingCoolingStateToThermostatMode = {
  [HOMEKIT_HEATING_COOLING_STATE.OFF]: THERMOSTAT_MODE.OFF,
  [HOMEKIT_HEATING_COOLING_STATE.HEAT]: THERMOSTAT_MODE.HEATING,
  [HOMEKIT_HEATING_COOLING_STATE.COOL]: THERMOSTAT_MODE.COOLING,
  [HOMEKIT_HEATING_COOLING_STATE.AUTO]: THERMOSTAT_MODE.AUTO,
};

// CurrentHeatingCoolingState has no idle value: a device running but doing nothing is reported as
// off, which the Home app shows as "Idle".
const thermostatOperatingStateToHeatingCoolingState = {
  [THERMOSTAT_OPERATING_STATE.IDLE]: HOMEKIT_HEATING_COOLING_STATE.OFF,
  [THERMOSTAT_OPERATING_STATE.HEATING]: HOMEKIT_HEATING_COOLING_STATE.HEAT,
  [THERMOSTAT_OPERATING_STATE.COOLING]: HOMEKIT_HEATING_COOLING_STATE.COOL,
};
// HomeKit knows three button events, Gladys has more than a hundred button statuses. Only those
// with an exact HomeKit equivalent are forwarded: anything else — arrow keys, rotation, shake,
// brightness gestures — would have to be reported as one of these three, and firing the wrong
// event in someone's home automation is worse than firing none.
//
// Integrations name the same three gestures differently. Zigbee2MQTT and Z-Wave use the CLICK
// family; Matter and the Zigbee2MQTT devices following its Switch cluster report a press and its
// release separately. INITIAL_PRESS is deliberately absent: Matter emits it at the start of every
// press, long ones included, so mapping it to SINGLE_PRESS would fire a single press each time
// someone holds the button down. The release carries the gesture, so that is what is mapped.
//
// Careful when checking which statuses have a producer: an integration does not have to import
// BUTTON_STATUS to emit one. Xiaomi keeps its own SWITCH_STATUS table in
// services/xiaomi/lib/utils/deviceStatus.js and emits those numbers straight onto a button:click
// feature, so LONG_CLICK_PRESS reaches this table as the value 3 without the constant ever being
// referenced. Grep for the value, not only for the name.
const buttonEventMapping = {
  [BUTTON_STATUS.CLICK]: 0, // SINGLE_PRESS
  [BUTTON_STATUS.SHORT_RELEASE]: 0, // SINGLE_PRESS — Matter and Zigbee2MQTT short_release
  [BUTTON_STATUS.PRESSED]: 0, // SINGLE_PRESS — Zigbee2MQTT pressed
  [BUTTON_STATUS.DOUBLE_CLICK]: 1, // DOUBLE_PRESS
  [BUTTON_STATUS.DOUBLE_PRESS]: 1, // DOUBLE_PRESS — Zigbee2MQTT double_press
  [BUTTON_STATUS.LONG_CLICK]: 2, // LONG_PRESS
  [BUTTON_STATUS.LONG_PRESS]: 2, // LONG_PRESS — Matter and Zigbee2MQTT long_press
  [BUTTON_STATUS.HOLD_CLICK]: 2, // LONG_PRESS — Zigbee2MQTT hold, Z-Wave hold
  // Xiaomi wireless switches, through SWITCH_STATUS. Its LONG_CLICK_RELEASE is left out so a
  // single hold does not fire twice.
  [BUTTON_STATUS.LONG_CLICK_PRESS]: 2, // LONG_PRESS
};

// Percentage at or below which a device with no dedicated low-battery feature is reported as low.
// HomeKit requires StatusLowBattery on every Battery service, so it has to be derived from the
// level when the device does not report it. 20% is what the other HomeKit bridges use.
const LOW_BATTERY_THRESHOLD = 20;

module.exports = {
  mappings,
  coverStateMapping,
  lockStateMapping,
  gasDetectedThresholds,
  aqiToAirQuality,
  clampToCharacteristic,
  toMicrogramPerCubicMeter,
  mergedServiceCategories,
  LOW_BATTERY_THRESHOLD,
  buttonEventMapping,
  HOMEKIT_HEATING_COOLING_STATE,
  acModeToHeatingCoolingState,
  heatingCoolingStateToAcMode,
  HOMEKIT_HEATER_COOLER_STATE,
  HOMEKIT_CURRENT_HEATER_COOLER_STATE,
  acModeToHeaterCoolerState,
  heaterCoolerStateToAcMode,
  thermostatModeToHeatingCoolingState,
  heatingCoolingStateToThermostatMode,
  thermostatOperatingStateToHeatingCoolingState,
};
