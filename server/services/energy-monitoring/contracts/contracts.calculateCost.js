const dayjs = require('dayjs');
const timezone = require('dayjs/plugin/timezone');

dayjs.extend(timezone);

const { ENERGY_CONTRACT_TYPES } = require('../../../utils/constants');
const { NotFoundError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const tempoData = require('../data/tempo');

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
  ) => {
    const consumptionDateHour = dayjs(consumptionDate)
      .tz(systemTimezone)
      .hour();
    const dateForColor = consumptionDate;
    // For hours before 6AM strictly, we use the previous day to get the color
    if (consumptionDateHour < 6) {
      dateForColor.setDate(dateForColor.getDate() - 1);
    }
    const consumptionDateDay = dateForColor.toISOString().split('T')[0];
    const consumptionDateYear = consumptionDateDay.split('-')[0];

    logger.debug(`Getting tempo data for date ${consumptionDateDay} at year ${consumptionDateYear}`);

    // Find tempo data for this day in the local dataset
    const tempoDayData = tempoData[consumptionDateYear].find((d) => d.date === consumptionDateDay);
    if (!tempoDayData) {
      throw new NotFoundError('No tempo data found for this day');
    }
    // Find the price list for the day color
    const energyPricesAtDay = energyPricesAtConsumptionDate.filter((p) => p.day_type === tempoDayData.color);
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
      `Found price: ${price.price / 10000}${price.currency}/kWh for time slot ${label} on day ${
        tempoDayData.color
      }, cost: ${cost}`,
    );
    return cost;
  },
};
