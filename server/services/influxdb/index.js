const logger = require('../../utils/logger');
const { ServiceNotConfiguredError } = require('../../utils/coreErrors');
const InfluxdbManager = require('./lib');


const INFLUXDB_URL = 'INFLUXDB_URL';
const INFLUXDB_TOKEN = 'INFLUXDB_TOKEN';
const INFLUXDB_ORG = 'INFLUXDB_ORG';
const INFLUXDB_BUCKET = 'INFLUXDB_BUCKET';

module.exports = function InfluxdbService(gladys, serviceId) {
  
  
  let influxdbUrl;
  let influxdbToken;
  let influxdbOrg;
  let influxdbBucket;

  /**
   * @public
   * @description This function starts the InfluxDB service
   * @example
   * gladys.services.influxdb.start();
   */
  async function start() {
    logger.info('Starting InfluxDB service');
    influxdbUrl = await gladys.variable.getValue(INFLUXDB_URL, serviceId);
    influxdbToken = await gladys.variable.getValue(INFLUXDB_TOKEN, serviceId);
    influxdbOrg = await gladys.variable.getValue(INFLUXDB_ORG, serviceId);
    influxdbBucket = await gladys.variable.getValue(INFLUXDB_BUCKET, serviceId);
    //if (!influxdbUrl || !influxdbToken || !influxdbBucket || !influxdbOrg) {
    //  throw new ServiceNotConfiguredError('InfluxDB Service not configured');
    //}


    const influxdbManager = new InfluxdbManager(gladys, serviceId, influxdbUrl, influxdbToken, influxdbOrg, influxdbBucket);
    influxdbManager.listen();
  }

  /**
   * @public
   * @description This function stops the InfluxDB service
   * @example
   * gladys.services.influxdb.stop();
   */
  async function stop() {
    logger.info('Stopping InfluxDB service');
  }

  

  return Object.freeze({
    start,
    stop,
  });
};
