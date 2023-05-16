const logger = require('../../utils/logger');
const EcowattController = require('./controllers/ecowatt.controller');

module.exports = function EcowattService(gladys, serviceId) {
  const dayjs = require('dayjs');
  const utc = require('dayjs/plugin/utc');
  const timezone = require('dayjs/plugin/timezone');
  dayjs.extend(utc);
  dayjs.extend(timezone);
  /**
   * @public
   * @description This function starts the service.
   * @example
   * gladys.services.ecowatt.start();
   */
  async function start() {
    logger.info('Starting Ecowatt service');
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   * gladys.services.ecowatt.stop();
   */
  async function stop() {
    logger.info('Stopping Ecowatt service');
  }

  /**
   * @description Return ecowatt data formatted.
   * @returns {Promise<object>} - Return ecowatt data.
   * @example const data = await getSignals();
   */
  async function getSignals() {
    const data = await gladys.gateway.getEcowattSignals();
    // Compose a slimed response
    const response = {
      today: null,
      days: [],
    };
    const today = dayjs();
    const todayDate = today.tz('Europe/Paris').format('YYYY-MM-DD');
    const tomorrow = today.add(1, 'day');
    const tomorrowDate = tomorrow.tz('Europe/Paris').format('YYYY-MM-DD');

    data.signals.forEach((day) => {
      const signalDate = dayjs(day.jour).format('YYYY-MM-DD');
      if (signalDate === todayDate) {
        response.today = day;
      }
      if (signalDate === tomorrowDate) {
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
