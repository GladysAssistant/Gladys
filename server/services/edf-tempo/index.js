const logger = require('../../utils/logger');

const edfTempoController = require('./controllers/edf-tempo.controller');

const PEAK_STATES = {
  blue: 'blue',
  white: 'white',
  red: 'red',
  unknown: 'not-defined',
};

module.exports = function EdfTempoService(gladys, serviceId) {
  const dayjs = require('dayjs');
  const utc = require('dayjs/plugin/utc');
  const timezone = require('dayjs/plugin/timezone');
  dayjs.extend(utc);
  dayjs.extend(timezone);
  /**
   * @public
   * @description This function starts the service.
   * @example
   * gladys.services.edf-tempo.start();
   */
  async function start() {
    logger.info('Starting EDF Tempo service');
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   * gladys.services.edf-tempo.stop();
   */
  async function stop() {
    logger.info('Stopping EDF Tempo service');
  }

  /**
   * @description Return EDF tempo data.
   * @returns {Promise<object>} - Return EDF tempo data data.
   * @example const data = await getEdfTempoStates();
   */
  async function getEdfTempoStates() {
    const today = dayjs();
    const todayHour = today.tz('Europe/Paris').hour();
    const data = await gladys.gateway.getEdfTempo();
    return {
      today_peak_state: PEAK_STATES[data.today],
      tomorrow_peak_state: PEAK_STATES[data.tomorrow],
      current_hour_peak_state: todayHour >= 6 && todayHour < 22 ? 'peak-hour' : 'off-peak-hour',
    };
  }

  return Object.freeze({
    start,
    stop,
    controllers: edfTempoController(getEdfTempoStates),
    getEdfTempoStates,
  });
};
