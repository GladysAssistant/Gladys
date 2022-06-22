const { promisify } = require('util');
const { CONFIGURATION, DEFAULT } = require('./constants');
const { NotFoundError } = require('../../../utils/coreErrors');

const sleep = promisify(setTimeout);

const updateOrDestroyVariable = async (variable, key, value, serviceId) => {
  if (value !== undefined && value !== null && (typeof value !== 'string' || value.length > 0)) {
    await variable.setValue(key, value, serviceId);
  } else {
    await variable.destroy(key, serviceId);
  }
};

/**
 * @description Save MQTT configuration.
 * @param {Object} configuration - MQTT configuration.
 * @param {string} [configuration.influxdbUrl] - MQTT URL.
 * @param {string} [configuration.influxdbToken] - MQTT username.
 * @param {string} [configuration.influxdbOrg] - MQTT password.
 * @param {string} [configuration.influxdbBucket] - MQTT password.
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
