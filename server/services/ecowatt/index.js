const logger = require('../../utils/logger');
const EcowattController = require('./controllers/ecowatt.controller');

const { SYSTEM_VARIABLE_NAMES } = require('../../utils/constants');

module.exports = function EcowattService(gladys, serviceId) {
  const dayjs = require('dayjs');
  const utc = require('dayjs/plugin/utc');
  const timezone = require('dayjs/plugin/timezone');
  dayjs.extend(utc);
  dayjs.extend(timezone);
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
    let systemTimezone = await gladys.variable.getValue(SYSTEM_VARIABLE_NAMES.TIMEZONE);
    if (!systemTimezone) {
      // Default to France as ecowatt is a french integration
      systemTimezone = 'Europe/Paris';
    }
    const data = await gladys.gateway.getEcowattSignals();
    // Compose a slimed response
    const response = {
      today: null,
      days: [],
    };
    const today = dayjs.tz(dayjs(), systemTimezone);
    const todayDate = today.format('YYYY-MM-DD');
    const tomorrow = today.add(1, 'day');
    const tomorrowDate = tomorrow.format('YYYY-MM-DD');

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
