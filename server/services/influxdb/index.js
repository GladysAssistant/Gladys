const logger = require('../../utils/logger');

const InfluxdbManager = require('./lib');
const InfluxdbController = require('./api/influxdb.controller');

module.exports = function InfluxdbService(gladys, serviceId) {
  const influxdbManager = new InfluxdbManager(gladys, serviceId);
  /**
   * @public
   * @description This function starts the InfluxDB service
   * @example
   * gladys.services.influxdb.start();
   */
  async function start() {
    logger.info('Starting InfluxDB service');
    await influxdbManager.init();
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
    controllers: InfluxdbController(influxdbManager),
  });
};
