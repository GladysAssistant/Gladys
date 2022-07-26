const { CONFIGURATION } = require('./constants');

const updateOrDestroyVariable = async (variable, key, value, serviceId) => {
  if (value !== undefined && value !== null && (typeof value !== 'string' || value.length > 0)) {
    await variable.setValue(key, value, serviceId);
  } else {
    await variable.destroy(key, serviceId);
  }
};

/**
 * @description Save InfluxDB configuration.
 * @param {Object} configuration - InfluxDB configuration.
 * @param {string} [configuration.influxdbUrl] - InfluxDB URL.
 * @param {string} [configuration.influxdbToken] - InfluxDB token.
 * @param {string} [configuration.influxdbOrg] - InfluxDB organization.
 * @param {string} [configuration.influxdbBucket] - InfluxDB bucket.
 * @example
 * saveConfiguration(configuration);
 */
async function saveConfiguration({ influxdbUrl, influxdbToken, influxdbOrg, influxdbBucket }) {
  const { variable } = this.gladys;
  await updateOrDestroyVariable(variable, CONFIGURATION.INFLUXDB_URL, influxdbUrl, this.serviceId);
  await updateOrDestroyVariable(variable, CONFIGURATION.INFLUXDB_TOKEN, influxdbToken, this.serviceId);
  await updateOrDestroyVariable(variable, CONFIGURATION.INFLUXDB_ORG, influxdbOrg, this.serviceId);
  await updateOrDestroyVariable(variable, CONFIGURATION.INFLUXDB_BUCKET, influxdbBucket, this.serviceId);

  return this.listen({ influxdbUrl, influxdbToken, influxdbOrg, influxdbBucket });
}

module.exports = {
  saveConfiguration,
};
