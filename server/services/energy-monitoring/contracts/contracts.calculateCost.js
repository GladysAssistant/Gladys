const { ENERGY_CONTRACT_TYPES } = require('../../../utils/constants');
const { NotFoundError } = require('../../../utils/coreErrors');
const logger = require('../../../utils/logger');
const tempoData = require('../data/tempo');

module.exports = {
  [ENERGY_CONTRACT_TYPES.BASE]: async (energyPricesAtConsumptionDate, consumptionDate, consumptionValue) => {
    const price = energyPricesAtConsumptionDate[0];
    if (!price) {
      throw new NotFoundError('No price found for this contract');
    }
    // Price are stored as integer so we need to divide by 100
    const cost = (price.price / 100) * consumptionValue;
    return cost;
  },
  [ENERGY_CONTRACT_TYPES.PEAK_OFF_PEAK]: async (energyPricesAtConsumptionDate, consumptionDate, consumptionValue) => {
    // Get the hour in the same timezone
    const consumptionDateHour = consumptionDate.getHours();
    // We find the price for this hour
    const price = energyPricesAtConsumptionDate.find((p) => {
      const hourSlots = p.hour_slots.split(',');
      return hourSlots.includes(consumptionDateHour.toString());
    });
    if (!price) {
      throw new NotFoundError('No price found for this hour');
    }
    // Price are stored as integer so we need to divide by 100
    const cost = (price.price / 100) * consumptionValue;
    return cost;
  },
  [ENERGY_CONTRACT_TYPES.EDF_TEMPO]: async (energyPricesAtConsumptionDate, consumptionDate, consumptionValue) => {
    const consumptionDateHour = consumptionDate.getHours();
    const consumptionDateYear = consumptionDate.getFullYear();
    const consumptionDateDay = consumptionDate.toISOString().split('T')[0];
    logger.debug(`Getting tempo data for date: ${consumptionDate}`);

    // Find tempo data for this day in the local dataset
    const tempoDayData = tempoData[consumptionDateYear].find((d) => d.date === consumptionDateDay);
    if (!tempoDayData) {
      throw new NotFoundError('No tempo data found for this day');
    }
    // Find the price list for the day color
    const energyPricesAtDay = energyPricesAtConsumptionDate.filter((p) => p.day_type === tempoDayData.color);
    const price = energyPricesAtDay.find((p) => {
      const hourSlots = p.hour_slots.split(',');
      return hourSlots.includes(consumptionDateHour.toString());
    });
    logger.debug(`Found price: ${price}`);
    if (!price) {
      throw new NotFoundError('No price found for this hour');
    }
    // Price are stored as integer so we need to divide by 100
    const cost = (price.price / 100) * consumptionValue;
    return cost;
  },
};
