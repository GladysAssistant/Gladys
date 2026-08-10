const {
  DEVICE_FEATURE_CATEGORIES,
  DEVICE_FEATURE_TYPES,
  DEVICE_FEATURE_UNITS,
  COVER_STATE,
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
// particulate densities, while Gladys splits them across categories. The first host category present
// on a device owns the service and absorbs the features of the other categories listed here.
const mergedServiceCategories = [
  {
    hosts: [
      DEVICE_FEATURE_CATEGORIES.AIRQUALITY_SENSOR,
      DEVICE_FEATURE_CATEGORIES.PM25_SENSOR,
      DEVICE_FEATURE_CATEGORIES.PM10_SENSOR,
    ],
    merged: [],
  },
  // Same for the battery: HomeKit shows a single Battery service, while Gladys splits the
  // percentage and the low-battery flag across two categories.
  {
    hosts: [DEVICE_FEATURE_CATEGORIES.BATTERY, DEVICE_FEATURE_CATEGORIES.BATTERY_LOW],
    merged: [],
  },
];

// Percentage at or below which a device with no dedicated low-battery feature is reported as low.
// HomeKit requires StatusLowBattery on every Battery service, so it has to be derived from the
// level when the device does not report it. 20% is what the other HomeKit bridges use.
const LOW_BATTERY_THRESHOLD = 20;

module.exports = {
  mappings,
  coverStateMapping,
  gasDetectedThresholds,
  aqiToAirQuality,
  clampToCharacteristic,
  toMicrogramPerCubicMeter,
  mergedServiceCategories,
  LOW_BATTERY_THRESHOLD,
};
