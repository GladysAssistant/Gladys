const logger = require('../../utils/logger');
const EcowattController = require('./controllers/ecowatt.controller');

module.exports = function EcowattService(gladys, serviceId) {
  /**
   * @public
   * @description This function starts the service
   * @example
   * gladys.services.ecowatt.start();
   */
  async function start() {
    logger.info('Starting Ecowatt service');
  }

  /**
   * @public
   * @description This function stops the service
   * @example
   * gladys.services.ecowatt.stop();
   */
  async function stop() {
    logger.info('Stopping Ecowatt service');
  }

  /**
   * @description Return ecowatt data formatted.
   * @returns {Promise<Object>} - Return ecowatt data.
   * @example const data = await getSignals();
   */
  async function getSignals() {
    const data = await gladys.gateway.getEcowattSignals();
    // Compose a slimed response
    const response = {
      today: null,
      days: [],
    };
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const todayDate = today.toDateString();
    const tomorrowDate = tomorrow.toDateString();

    data.signals.forEach((day) => {
      const dateInFile = new Date(day.jour).toDateString();
      if (dateInFile === todayDate) {
        response.today = day;
      }
      if (dateInFile === tomorrowDate) {
        response.tomorrow = day;
      }
      response.days.push({
        jour: day.jour,
        dvalue: day.dvalue,
      });
    });
    return response;
  }

  return Object.freeze({
    start,
    stop,
    controllers: EcowattController(getSignals),
    getSignals,
  });
};
