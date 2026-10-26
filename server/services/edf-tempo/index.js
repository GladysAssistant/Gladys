const logger = require('../../utils/logger');

const edfTempoController = require('./controllers/edf-tempo.controller');
const {
  TEMPO_CALENDAR,
  TEMPO_CALENDAR_KEY,
  EDF_TEMPO_TEMPLATE,
} = require('../../lib/energy-contract/templates/internal');

const PEAK_STATES = {
  blue: 'blue',
  white: 'white',
  red: 'red',
  unknown: 'not-defined',
};

// Colours are published for the last 3 years on the first run, then from the last known day
const HISTORY_DAYS = 3 * 365;
const HISTORY_TAKE = 1000000;
const PUBLISH_CRON = '0 15 11,17 * * *';

module.exports = function EdfTempoService(gladys, serviceId) {
  const dayjs = require('dayjs');
  const utc = require('dayjs/plugin/utc');
  const timezone = require('dayjs/plugin/timezone');
  dayjs.extend(utc);
  dayjs.extend(timezone);
  let publishJob = null;

  /**
   * @description Publish the Tempo colours into the `tempo` tariff calendar (internal
   * provider of the energy contracts, docs/specs/energy-contracts.md 9.2): declares the
   * calendar, then upserts every day returned by Gladys Plus since the last known day.
   * @returns {Promise<object|null>} The publication result, null when nothing to publish.
   * @example
   * await publishTempoCalendar();
   */
  async function publishTempoCalendar() {
    const { calendar } = await gladys.energyContract.declareCalendar(TEMPO_CALENDAR, serviceId);
    const from = calendar.last_at
      ? dayjs(calendar.last_at)
          .tz('Europe/Paris')
          .subtract(2, 'day')
      : dayjs()
          .tz('Europe/Paris')
          .subtract(HISTORY_DAYS, 'day');
    const days = await gladys.gateway.getEdfTempoHistorical(from.format('YYYY-MM-DD'), HISTORY_TAKE);
    const entries = (days || [])
      .filter((day) => TEMPO_CALENDAR.values.includes(day.day_type))
      .map((day) => ({ date: day.created_at, value: day.day_type }));
    if (entries.length === 0) {
      logger.info('EDF Tempo: no colour to publish');
      return null;
    }
    const result = await gladys.energyContract.publishCalendarEntries(TEMPO_CALENDAR_KEY, entries, {
      provider_service_id: serviceId,
    });
    logger.info(`EDF Tempo: ${result.count} day colour(s) published in the "${TEMPO_CALENDAR_KEY}" calendar`);
    return result;
  }

  /**
   * @public
   * @description This function starts the service.
   * @example
   * gladys.services.edf-tempo.start();
   */
  async function start() {
    logger.info('Starting EDF Tempo service');
    try {
      await publishTempoCalendar();
    } catch (e) {
      logger.warn(`EDF Tempo: unable to publish the colours (${e.message})`);
    }
    if (!publishJob) {
      // tomorrow's colour is known at 11:00 Paris time: publish after it, and once more later
      publishJob = gladys.scheduler.scheduleJob(PUBLISH_CRON, async () => {
        try {
          await publishTempoCalendar();
        } catch (e) {
          logger.warn(`EDF Tempo: unable to publish the colours (${e.message})`);
        }
      });
    }
  }

  /**
   * @public
   * @description This function stops the service.
   * @example
   * gladys.services.edf-tempo.stop();
   */
  async function stop() {
    logger.info('Stopping EDF Tempo service');
    if (publishJob) {
      gladys.scheduler.cancelJob(publishJob);
      publishJob = null;
    }
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
    publishTempoCalendar,
    // internal provider of the energy contracts capability (template + calendar)
    energyContracts: Object.freeze({ templates: [EDF_TEMPO_TEMPLATE], calendars: [TEMPO_CALENDAR] }),
  });
};
