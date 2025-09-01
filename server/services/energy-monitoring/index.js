const logger = require('../../utils/logger');
const EnergyMonitoringHandler = require('./lib');
const EnergyMonitoringController = require('./api/energy-monitoring.controller');

module.exports = function EnergyMonitoringService(gladys, serviceId) {
  const energyMonitoringHandler = new EnergyMonitoringHandler(gladys, serviceId);

  /**
   * @public
   * @description This function starts the energy monitoring service.
   * @example
   * gladys.services.energyMonitoring.start();
   */
  async function start() {
    logger.info('Starting energy monitoring service');
    energyMonitoringHandler.init();
  }

  /**
   * @public
   * @description This function stops the energy monitoring service.
   * @example
   * gladys.services.energyMonitoring.stop();
   */
  async function stop() {
    logger.info('Stopping energy monitoring service');
  }

  return Object.freeze({
    start,
    stop,
    device: energyMonitoringHandler,
    controllers: EnergyMonitoringController(energyMonitoringHandler),
  });
};
