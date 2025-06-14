const { DEVICE_FEATURE_UNITS, MEASUREMENT_UNITS } = require('./constants');

const DISTANCE_UNIT_CONVERSIONS = {
  [MEASUREMENT_UNITS.US]: {
    [DEVICE_FEATURE_UNITS.MM]: { unit: DEVICE_FEATURE_UNITS.INCH, convert: (mm) => mm / 25.4 },
    [DEVICE_FEATURE_UNITS.CM]: { unit: DEVICE_FEATURE_UNITS.INCH, convert: (cm) => cm / 2.54 },
    [DEVICE_FEATURE_UNITS.M]: { unit: DEVICE_FEATURE_UNITS.FEET, convert: (m) => m * 3.28084 },
    [DEVICE_FEATURE_UNITS.KM]: { unit: DEVICE_FEATURE_UNITS.MILE, convert: (km) => km / 1.60934 },
    [DEVICE_FEATURE_UNITS.KILOMETER_PER_HOUR]: {
      unit: DEVICE_FEATURE_UNITS.MILE_PER_HOUR,
      convert: (kmh) => kmh / 1.60934,
    },
    [DEVICE_FEATURE_UNITS.METER_PER_SECOND]: {
      unit: DEVICE_FEATURE_UNITS.FEET_PER_SECOND,
      convert: (ms) => ms * 3.28084,
    },
    [DEVICE_FEATURE_UNITS.KM_PER_KILOWATT_HOUR]: {
      unit: DEVICE_FEATURE_UNITS.MILE_PER_KILOWATT_HOUR,
      convert: (kmpkwh) => kmpkwh / 1.60934,
    },
    [DEVICE_FEATURE_UNITS.KILOWATT_HOUR_PER_100_KM]: {
      unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR_PER_100_MILE,
      convert: (kwh) => kwh / 1.60934,
    },
    [DEVICE_FEATURE_UNITS.WATT_HOUR_PER_KM]: {
      unit: DEVICE_FEATURE_UNITS.WATT_HOUR_PER_MILE,
      convert: (wh) => wh / 1.60934,
    },
  },
  [MEASUREMENT_UNITS.METRIC]: {
    [DEVICE_FEATURE_UNITS.INCH]: {
      unit: DEVICE_FEATURE_UNITS.MM,
      convert: (inch) => inch * 25.4,
    },
    [DEVICE_FEATURE_UNITS.FEET]: {
      unit: DEVICE_FEATURE_UNITS.M,
      convert: (feet) => feet * 0.3048,
    },
    [DEVICE_FEATURE_UNITS.MILE]: { unit: DEVICE_FEATURE_UNITS.KM, convert: (mile) => mile * 1.60934 },
    [DEVICE_FEATURE_UNITS.MILE_PER_HOUR]: {
      unit: DEVICE_FEATURE_UNITS.KILOMETER_PER_HOUR,
      convert: (mph) => mph * 1.60934,
    },
    [DEVICE_FEATURE_UNITS.FEET_PER_SECOND]: {
      unit: DEVICE_FEATURE_UNITS.METER_PER_SECOND,
      convert: (fps) => fps * 0.3048,
    },
    [DEVICE_FEATURE_UNITS.MILE_PER_KILOWATT_HOUR]: {
      unit: DEVICE_FEATURE_UNITS.KM_PER_KILOWATT_HOUR,
      convert: (kwh) => kwh * 1.60934,
    },
    [DEVICE_FEATURE_UNITS.KILOWATT_HOUR_PER_100_MILE]: {
      unit: DEVICE_FEATURE_UNITS.KILOWATT_HOUR_PER_100_KM,
      convert: (kwh) => kwh * 1.60934,
    },
    [DEVICE_FEATURE_UNITS.WATT_HOUR_PER_MILE]: {
      unit: DEVICE_FEATURE_UNITS.WATT_HOUR_PER_KM,
      convert: (wh) => wh * 1.60934,
    },
  },
};

const UNIT_CONVERSIONS = {
  [MEASUREMENT_UNITS.US]: {
    ...DISTANCE_UNIT_CONVERSIONS[MEASUREMENT_UNITS.US],
  },
  [MEASUREMENT_UNITS.METRIC]: {
    ...DISTANCE_UNIT_CONVERSIONS[MEASUREMENT_UNITS.METRIC],
  },
};

module.exports = {
  UNIT_CONVERSIONS,
};
