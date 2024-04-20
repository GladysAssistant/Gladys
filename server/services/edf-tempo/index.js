const logger = require('../../utils/logger');

const edfTempoController = require('./controllers/edf-tempo.controller');

const PEAK_STATES = {
  TEMPO_BLEU: 'blue',
  TEMPO_BLANC: 'white',
  TEMPO_ROUGE: 'red',
  NON_DEFINI: 'not-defined',
};

module.exports = function EdfTempoService(gladys, serviceId) {
  const dayjs = require('dayjs');
  const axios = require('axios').default;
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
    const todayDate = today.tz('Europe/Paris').format('YYYY-MM-DD');
    const todayHour = today.tz('Europe/Paris').hour();
    const { data } = await axios.get(
      `https://particulier.edf.fr/services/rest/referentiel/searchTempoStore?dateRelevant=${todayDate}`,
    );
    return {
      today_peak_state: PEAK_STATES[data.couleurJourJ],
      tomorrow_peak_state: PEAK_STATES[data.couleurJourJ1],
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
