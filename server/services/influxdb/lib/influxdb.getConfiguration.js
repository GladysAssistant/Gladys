const { CONFIGURATION } = require('./constants');

/**
 * @description Get InfluxDB configuration.
 * @returns {Promise} Current InfluxDB configuration.
 * @example
 * getConfiguration();
 */
async function getConfiguration() {
  const influxdbUrl = await this.gladys.variable.getValue(CONFIGURATION.INFLUXDB_URL, this.serviceId);
  const influxdbToken = await this.gladys.variable.getValue(CONFIGURATION.INFLUXDB_TOKEN, this.serviceId);
  const influxdbOrg = await this.gladys.variable.getValue(CONFIGURATION.INFLUXDB_ORG, this.serviceId);
  const influxdbBucket = await this.gladys.variable.getValue(CONFIGURATION.INFLUXDB_BUCKET, this.serviceId);

  return {
    influxdbUrl,
    influxdbToken,
    influxdbOrg,
    influxdbBucket,
  };
}

module.exports = {
  getConfiguration,
};
