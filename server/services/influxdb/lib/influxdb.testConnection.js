const { InfluxDB } = require('@influxdata/influxdb-client');
const { HealthAPI } = require('@influxdata/influxdb-client-apis');
const logger = require('../../../utils/logger');

/**
 * @description Instenciate influxdb client and get health.
 * @param {Object} configuration - InfluxDB configuration.
 * @example
 * influxdb.testConnection();
 */
function testConnection(configuration) {
  logger.info('test function');
  logger.info(configuration.influxdbUrl);
  this.influxdbClient = new InfluxDB({ url: configuration.influxdbUrl, token: configuration.influxdbToken });
  const healthAPI = new HealthAPI(this.influxdbClient);

  healthAPI
    .getHealth()
    .then((result /* : HealthCheck */) => {
      logger.info(JSON.stringify(result, null, 2));
      logger.info('\nFinished SUCCESS');
      return true;
    })
    .catch((error) => {
      logger.info(error);
      logger.info('\nFinished ERROR');
      return false;
    });
}

module.exports = {
  testConnection,
};
