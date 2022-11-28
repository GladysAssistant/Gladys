const { InfluxDB } = require('@influxdata/influxdb-client');
const { HealthAPI } = require('@influxdata/influxdb-client-apis');
const logger = require('../../../utils/logger');

/**
 * @description Instenciate influxdb client and get health.
 * @param {Object} configuration - InfluxDB configuration.
 * @returns {boolean} Boolean result.
 * @example
 * influxdb.testConnection();
 */
function testConnection(configuration) {
  logger.info('Test connection to influxdb');
  logger.info(configuration.influxdbUrl);
  this.influxdbClient = new InfluxDB({ url: configuration.influxdbUrl, token: configuration.influxdbToken });
  const healthAPI = new HealthAPI(this.influxdbClient);
  let status;
  healthAPI
    .getHealth()
    .then((result /* : HealthCheck */) => {
      status = true;
    })
    .catch((error) => {
      status = false;
    });
  return status;
}

module.exports = {
  testConnection,
};
