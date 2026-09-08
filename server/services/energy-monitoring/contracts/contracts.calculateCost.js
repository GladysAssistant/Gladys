const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(timezone);

const { ENERGY_CONTRACT_TYPES } = require('../../../utils/constants');
const { NotFoundError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');

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
 * @description Whether a price row applies to the given HH:MM slot label.
 * A row without hour slots applies to the whole day.
 * @param {object} price - The energy price row.
 * @param {string} label - The HH:MM slot label.
 * @returns {boolean} True when the price covers the slot.
 * @example priceCoversSlot({ hour_slots: '08:00,08:30' }, '08:00');
 */
function priceCoversSlot(price, label) {
  const hourSlots = (price.hour_slots || '')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return hourSlots.length === 0 || hourSlots.includes(label);
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
    // Compute the HH:MM slot label
    const label = formatDateToSlotLabel(consumptionDate, systemTimezone);
    // Find the price for this time slot
    const price = energyPricesAtConsumptionDate.find((p) => {
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
    return cost;
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
  [ENERGY_CONTRACT_TYPES.DAY_TYPE]: async (
    energyPricesAtConsumptionDate,
    consumptionDate,
    consumptionValue,
    systemTimezone,
    { dayTypeMap },
  ) => {
    // The day type (weekday, weekend, holiday...) comes from the energy
    // calendar provider, keyed by the calendar day in the system timezone.
    const consumptionDay = dayjs(consumptionDate)
      .tz(systemTimezone)
      .format('YYYY-MM-DD');
    const dayType = dayTypeMap.get(consumptionDay);
    if (!dayType) {
      throw new NotFoundError(`No day type found for day ${consumptionDay}`);
    }
    // Prices of this day type first; prices without a day type are the
    // fallback for the days the contract does not single out.
    let energyPricesAtDay = energyPricesAtConsumptionDate.filter((p) => p.day_type === dayType);
    if (energyPricesAtDay.length === 0) {
      energyPricesAtDay = energyPricesAtConsumptionDate.filter((p) => !p.day_type || p.day_type === 'any');
    }
    const label = formatDateToSlotLabel(consumptionDate, systemTimezone);
    // A price listing the slot wins over a whole-day price.
    const price =
      energyPricesAtDay.find((p) => (p.hour_slots || '').trim().length > 0 && priceCoversSlot(p, label)) ||
      energyPricesAtDay.find((p) => priceCoversSlot(p, label));
    if (!price) {
      throw new NotFoundError(`No price found for time slot ${label} on day type ${dayType}`);
    }
    // Price are stored as integer with 4 decimals
    const cost = (price.price / 10000) * consumptionValue;
    logger.debug(
      `Found price: ${price.price / 10000}${
        price.currency
      }/kWh for time slot ${label} on day type ${dayType}, cost: ${cost}`,
    );
    return cost;
  },
};
