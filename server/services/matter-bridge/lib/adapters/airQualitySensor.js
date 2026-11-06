const { DEVICE_FEATURE_CATEGORIES, DEVICE_FEATURE_TYPES } = require('../../../../utils/constants');
const { isNumber, airQualityOf } = require('../converters');
const { MEASUREMENT_UNIT, MEASUREMENT_MEDIUM } = require('../constants');
const { isFeature, zipRoles } = require('./helpers');

const NUMERIC = [DEVICE_FEATURE_TYPES.SENSOR.DECIMAL, DEVICE_FEATURE_TYPES.SENSOR.INTEGER];

// Each Gladys concentration and the Matter concentration measurement cluster it feeds.
const CONCENTRATIONS = {
  co2: {
    category: DEVICE_FEATURE_CATEGORIES.CO2_SENSOR,
    cluster: 'carbonDioxideConcentrationMeasurement',
    server: 'CarbonDioxideConcentrationMeasurementServer',
    unit: MEASUREMENT_UNIT.PPM,
  },
  pm25: {
    category: DEVICE_FEATURE_CATEGORIES.PM25_SENSOR,
    cluster: 'pm25ConcentrationMeasurement',
    server: 'Pm25ConcentrationMeasurementServer',
    unit: MEASUREMENT_UNIT.UGM3,
  },
  pm10: {
    category: DEVICE_FEATURE_CATEGORIES.PM10_SENSOR,
    cluster: 'pm10ConcentrationMeasurement',
    server: 'Pm10ConcentrationMeasurementServer',
    unit: MEASUREMENT_UNIT.UGM3,
  },
};

/**
 * @description Read the concentrations an air quality endpoint currently reports.
 * @param {object} endpointState - State of the endpoint.
 * @returns {object} PM2.5 and CO2 concentrations, when the endpoint measures them.
 * @example
 * currentConcentrations(endpoint.state);
 */
function currentConcentrations(endpointState) {
  const read = (role) => {
    const cluster = endpointState[CONCENTRATIONS[role].cluster];
    return cluster ? cluster.measuredValue : null;
  };
  return { pm25: read('pm25'), co2: read('co2') };
}

// One Matter air quality sensor per device, carrying every concentration it measures. Matter apps
// show the overall air quality first, so it is derived from those concentrations.
const airQualitySensor = {
  key: 'air-quality',
  claim(features) {
    const featuresByRole = {};
    Object.entries(CONCENTRATIONS).forEach(([role, { category }]) => {
      featuresByRole[role] = features.filter((f) => isFeature(f, category, NUMERIC));
    });
    return zipRoles(featuresByRole);
  },
  build(matter, roles, ctx) {
    const servers = [];
    const state = {};
    const values = {};
    Object.entries(CONCENTRATIONS).forEach(([role, { cluster, server, unit }]) => {
      if (!roles[role]) {
        return;
      }
      const value = ctx.read(roles[role]);
      values[role] = value;
      servers.push(matter.behaviors[server].with('NumericMeasurement'));
      state[cluster] = {
        measuredValue: isNumber(value) ? value : null,
        minMeasuredValue: null,
        maxMeasuredValue: null,
        measurementUnit: unit,
        measurementMedium: MEASUREMENT_MEDIUM.AIR,
      };
    });
    state.airQuality = { airQuality: airQualityOf(values) };
    return { type: matter.devices.AirQualitySensorDevice.with(...servers), state };
  },
  toMatter(role, value, roles, endpointState) {
    const { cluster } = CONCENTRATIONS[role];
    return {
      [cluster]: { measuredValue: value },
      airQuality: { airQuality: airQualityOf({ ...currentConcentrations(endpointState), [role]: value }) },
    };
  },
  listeners: [],
};

module.exports = airQualitySensor;
