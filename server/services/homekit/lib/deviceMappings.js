const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES, COVER_STATE } = require('../../../utils/constants');

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
  [DEVICE_FEATURE_CATEGORIES.SWITCH]: {
    service: 'Switch',
    capabilities: {
      [DEVICE_FEATURE_TYPES.SWITCH.BINARY]: {
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

// US EPA air quality index bands, each one mapped to the closest HomeKit air quality level.
const airQualityIndexMapping = [
  { maxIndex: 50, airQuality: HOMEKIT_AIR_QUALITY.EXCELLENT },
  { maxIndex: 100, airQuality: HOMEKIT_AIR_QUALITY.GOOD },
  { maxIndex: 150, airQuality: HOMEKIT_AIR_QUALITY.FAIR },
  { maxIndex: 200, airQuality: HOMEKIT_AIR_QUALITY.INFERIOR },
];

// Concentration, in ppm, above which HomeKit is told the gas is detected.
const gasDetectedThresholds = {
  [DEVICE_FEATURE_CATEGORIES.CO_SENSOR]: 25,
  [DEVICE_FEATURE_CATEGORIES.CO2_SENSOR]: 1000,
};

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

module.exports = {
  mappings,
  coverStateMapping,
  gasDetectedThresholds,
  aqiToAirQuality,
  clampToCharacteristic,
};
