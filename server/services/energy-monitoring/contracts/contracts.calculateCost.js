const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(timezone);

const { ENERGY_CONTRACT_TYPES, ENERGY_PRICE_DAY_TYPES } = require('../../../utils/constants');
const { NotFoundError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const { getConsumptionCalendarDayType } = require('./contracts.getConsumptionCalendarDayType');

const TEMPO_DAY_TYPES = new Set([
  ENERGY_PRICE_DAY_TYPES.RED,
  ENERGY_PRICE_DAY_TYPES.BLUE,
  ENERGY_PRICE_DAY_TYPES.WHITE,
]);

const CALENDAR_DAY_TYPES = new Set([
  ENERGY_PRICE_DAY_TYPES.WEEKDAY,
  ENERGY_PRICE_DAY_TYPES.WEEKEND,
  ENERGY_PRICE_DAY_TYPES.HOLIDAY,
]);

/**
 * @description Convert a Date to an HH:MM slot label at 30-minute granularity.
 * @param {Date} date - The date of the consumption sample.
 * @param {string} systemTimezone - The timezone of the system.
 * @returns {string} The label formatted as HH:MM (minutes are 00 or 30).
 * @example formatDateToSlotLabel(new Date('2025-09-11T17:14:57+02:00'), 'Europe/Paris');
 */
function formatDateToSlotLabel(date, systemTimezone) {
  const dayjsDate = dayjs(date).tz(systemTimezone);
  const hour = dayjsDate.hour();
  const minutes = dayjsDate.minute() >= 30 ? '30' : '00';
  const hh = hour < 10 ? `0${hour}` : `${hour}`;
  return `${hh}:${minutes}`;
}

/**
 * @description Check if a price row applies to the current calendar day type.
 * @param {object} price - The energy price row.
 * @param {string} calendarDayType - The resolved calendar day type.
 * @returns {boolean} True when the price applies to this day.
 */
function priceMatchesCalendarDayType(price, calendarDayType) {
  const { day_type: dayType } = price;
  if (!dayType || dayType === 'any') {
    return true;
  }
  if (TEMPO_DAY_TYPES.has(dayType)) {
    return true;
  }
  return dayType === calendarDayType;
}

/**
 * @description Check if hour slots match, with all-day support for weekend/holiday rows.
 * @param {object} price - The energy price row.
 * @param {string} label - The HH:MM slot label.
 * @returns {boolean} True when the price applies to this time slot.
 */
function priceMatchesHourSlot(price, label) {
  const hourSlots = (price.hour_slots || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);

  if (hourSlots.length === 0) {
    const { day_type: dayType } = price;
    return dayType === ENERGY_PRICE_DAY_TYPES.WEEKEND || dayType === ENERGY_PRICE_DAY_TYPES.HOLIDAY;
  }

  return hourSlots.includes(label);
}

/**
 * @description Determine if calendar day filtering should be applied.
 * @param {string} contract - The contract type.
 * @param {Array} energyPricesAtConsumptionDate - The price rows for the consumption date.
 * @returns {boolean} True when day-of-week filtering is required.
 */
function usesCalendarDayFiltering(contract, energyPricesAtConsumptionDate) {
  if (contract === ENERGY_CONTRACT_TYPES.NIGHT_WEEKEND) {
    return true;
  }
  if (contract === ENERGY_CONTRACT_TYPES.PEAK_OFF_PEAK) {
    return energyPricesAtConsumptionDate.some((price) => CALENDAR_DAY_TYPES.has(price.day_type));
  }
  return false;
}

/**
 * @description Calculate cost for peak/off-peak contracts, optionally filtered by calendar day type.
 * @param {Array} energyPricesAtConsumptionDate - The price rows for the consumption date.
 * @param {Date} consumptionDate - The date of the consumption sample.
 * @param {number} consumptionValue - The consumption value in kWh.
 * @param {string} systemTimezone - The timezone of the system.
 * @param {string} contract - The contract type.
 * @returns {number} The calculated cost.
 */
function calculatePeakOffPeakCost(
  energyPricesAtConsumptionDate,
  consumptionDate,
  consumptionValue,
  systemTimezone,
  contract,
) {
  const label = formatDateToSlotLabel(consumptionDate, systemTimezone);
  let pricesToSearch = energyPricesAtConsumptionDate;

  if (usesCalendarDayFiltering(contract, energyPricesAtConsumptionDate)) {
    const calendarDayType = getConsumptionCalendarDayType(consumptionDate, systemTimezone);
    pricesToSearch = energyPricesAtConsumptionDate.filter((price) =>
      priceMatchesCalendarDayType(price, calendarDayType),
    );

    if (pricesToSearch.length === 0) {
      throw new NotFoundError(`No price found for calendar day type ${calendarDayType}`);
    }
  }

  const price = pricesToSearch.find((p) => priceMatchesHourSlot(p, label));
  if (!price) {
    throw new NotFoundError(`No price found for time slot ${label}`);
  }

  const cost = (price.price / 10000) * consumptionValue;
  return cost;
}

module.exports = {
  [ENERGY_CONTRACT_TYPES.BASE]: async (energyPricesAtConsumptionDate, consumptionDate, consumptionValue) => {
    const price = energyPricesAtConsumptionDate[0];
    if (!price) {
      throw new NotFoundError('No price found for this contract');
    }
    // Price are stored as integer with 4 decimals
    const cost = (price.price / 10000) * consumptionValue;
    return cost;
  },
  [ENERGY_CONTRACT_TYPES.PEAK_OFF_PEAK]: async (
    energyPricesAtConsumptionDate,
    consumptionDate,
    consumptionValue,
    systemTimezone,
  ) => {
    return calculatePeakOffPeakCost(
      energyPricesAtConsumptionDate,
      consumptionDate,
      consumptionValue,
      systemTimezone,
      ENERGY_CONTRACT_TYPES.PEAK_OFF_PEAK,
    );
  },
  [ENERGY_CONTRACT_TYPES.NIGHT_WEEKEND]: async (
    energyPricesAtConsumptionDate,
    consumptionDate,
    consumptionValue,
    systemTimezone,
  ) => {
    return calculatePeakOffPeakCost(
      energyPricesAtConsumptionDate,
      consumptionDate,
      consumptionValue,
      systemTimezone,
      ENERGY_CONTRACT_TYPES.NIGHT_WEEKEND,
    );
  },
  [ENERGY_CONTRACT_TYPES.EDF_TEMPO]: async (
    energyPricesAtConsumptionDate,
    consumptionDate,
    consumptionValue,
    systemTimezone,
    { edfTempoHistoricalMap },
  ) => {
    const consumptionDateHour = dayjs(consumptionDate)
      .tz(systemTimezone)
      .hour();
    let dateForColor = dayjs(consumptionDate).tz(systemTimezone);
    // For hours before 6AM strictly, we use the previous day to get the color
    if (consumptionDateHour < 6) {
      dateForColor = dateForColor.subtract(1, 'day');
    }
    const consumptionDateDay = dateForColor.format('YYYY-MM-DD');
    const consumptionDateYear = consumptionDateDay.split('-')[0];

    logger.debug(`Getting tempo data for date ${consumptionDateDay} at year ${consumptionDateYear}`);

    // Find tempo data for this day in the local dataset
    const tempoDayDayType = edfTempoHistoricalMap.get(consumptionDateDay);
    if (!tempoDayDayType) {
      throw new NotFoundError('No tempo data found for this day');
    }
    // Find the price list for the day color
    const energyPricesAtDay = energyPricesAtConsumptionDate.filter((p) => p.day_type === tempoDayDayType);
    const label = formatDateToSlotLabel(consumptionDate, systemTimezone);
    const price = energyPricesAtDay.find((p) => {
      const hourSlots = (p.hour_slots || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
      return hourSlots.includes(label);
    });
    if (!price) {
      throw new NotFoundError(`No price found for time slot ${label}`);
    }
    // Price are stored as integer with 4 decimals
    const cost = (price.price / 10000) * consumptionValue;
    logger.debug(
      `Found price: ${price.price / 10000}${
        price.currency
      }/kWh for time slot ${label} on day ${tempoDayDayType}, cost: ${cost}`,
    );
    return cost;
  },
};
