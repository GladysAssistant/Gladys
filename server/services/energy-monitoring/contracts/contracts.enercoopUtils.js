const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');
const { getEnercoopSeason } = require('../../../lib/french-calendar');

dayjs.extend(timezone);

/**
 * @description Convert a Date to an HH:MM slot label at 30-minute granularity.
 * @param {Date} date - The date of the consumption sample.
 * @param {string} systemTimezone - The timezone of the system.
 * @returns {string} The label formatted as HH:MM (minutes are 00 or 30).
 */
function formatDateToSlotLabel(date, systemTimezone) {
  const dayjsDate = dayjs(date).tz(systemTimezone);
  const hour = dayjsDate.hour();
  const minutes = dayjsDate.minute() >= 30 ? '30' : '00';
  const hh = hour < 10 ? `0${hour}` : `${hour}`;
  return `${hh}:${minutes}`;
}

/**
 * @description Generate 30-minute slot labels between two hours (inclusive start, exclusive end).
 * @param {number} startHour - Start hour (0-23).
 * @param {number} endHour - End hour (0-24), exclusive.
 * @returns {Set<string>} Set of slot labels.
 */
function generateSlotLabelsBetweenHours(startHour, endHour) {
  const slots = new Set();
  for (let hour = startHour; hour < endHour; hour += 1) {
    const hh = hour < 10 ? `0${hour}` : `${hour}`;
    slots.add(`${hh}:00`);
    slots.add(`${hh}:30`);
  }
  return slots;
}

const NUIT_WEEKEND_OFF_PEAK_SLOTS = generateSlotLabelsBetweenHours(23, 24);
generateSlotLabelsBetweenHours(0, 6).forEach((slot) => NUIT_WEEKEND_OFF_PEAK_SLOTS.add(slot));

const WINTER_WEEKDAY_OFF_PEAK_SLOTS = new Set([
  ...generateSlotLabelsBetweenHours(0, 7),
  ...generateSlotLabelsBetweenHours(13, 16),
]);

const SUMMER_WEEKDAY_OFF_PEAK_SLOTS = generateSlotLabelsBetweenHours(11, 17);

/**
 * @description Get consumption context for Enercoop tariff rules.
 * @param {Date} consumptionDate - Consumption date.
 * @param {string} systemTimezone - System timezone.
 * @param {object} options - Calendar options.
 * @param {Set<string>} options.publicHolidaysSet - Public holiday dates.
 * @returns {object} Consumption context.
 */
function getEnercoopConsumptionContext(consumptionDate, systemTimezone, { publicHolidaysSet }) {
  const localDate = dayjs(consumptionDate).tz(systemTimezone);
  const dateStr = localDate.format('YYYY-MM-DD');
  const dayOfWeek = localDate.day();
  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

  return {
    slotLabel: formatDateToSlotLabel(consumptionDate, systemTimezone),
    dateStr,
    isWeekend,
    isPublicHoliday: publicHolidaysSet.has(dateStr),
    season: getEnercoopSeason(consumptionDate, systemTimezone),
  };
}

/**
 * @description Check if consumption is off-peak for Enercoop Nuit & Week-end contract.
 * @param {object} context - Consumption context from getEnercoopConsumptionContext.
 * @returns {boolean} True if off-peak.
 */
function isEnercoopNuitWeekendOffPeak(context) {
  if (context.isPublicHoliday || context.isWeekend) {
    return true;
  }
  return NUIT_WEEKEND_OFF_PEAK_SLOTS.has(context.slotLabel);
}

/**
 * @description Check if consumption is off-peak for Enercoop 2 Saisons contract.
 * @param {object} context - Consumption context from getEnercoopConsumptionContext.
 * @returns {boolean} True if off-peak.
 */
function isEnercoop2SaisonsOffPeak(context) {
  if (context.isPublicHoliday || context.isWeekend) {
    return true;
  }
  if (context.season === 'summer') {
    return SUMMER_WEEKDAY_OFF_PEAK_SLOTS.has(context.slotLabel);
  }
  return WINTER_WEEKDAY_OFF_PEAK_SLOTS.has(context.slotLabel);
}

/**
 * @description Find peak or off-peak price row for Enercoop contracts.
 * @param {Array} energyPricesAtConsumptionDate - Price rows for the date.
 * @param {boolean} isOffPeak - Whether off-peak rate applies.
 * @returns {object|undefined} Matching price row.
 */
function findEnercoopRatePrice(energyPricesAtConsumptionDate, isOffPeak) {
  const rateType = isOffPeak ? 'off_peak' : 'peak';
  return energyPricesAtConsumptionDate.find((p) => p.rate_type === rateType);
}

module.exports = {
  formatDateToSlotLabel,
  generateSlotLabelsBetweenHours,
  getEnercoopConsumptionContext,
  isEnercoopNuitWeekendOffPeak,
  isEnercoop2SaisonsOffPeak,
  findEnercoopRatePrice,
  NUIT_WEEKEND_OFF_PEAK_SLOTS,
  WINTER_WEEKDAY_OFF_PEAK_SLOTS,
  SUMMER_WEEKDAY_OFF_PEAK_SLOTS,
};
