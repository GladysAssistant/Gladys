const axios = require('axios');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { LRUCache } = require('lru-cache');
const logger = require('../../utils/logger');

dayjs.extend(utc);
dayjs.extend(timezone);

const publicHolidaysCache = new LRUCache({
  max: 20,
  ttl: 1000 * 60 * 60 * 24 * 7,
});

/**
 * @description Build a set of French public holiday dates (YYYY-MM-DD) between two dates.
 * Uses the official calendrier.api.gouv.fr open API.
 * @param {string} startDate - Start date (YYYY-MM-DD).
 * @param {string} endDate - End date (YYYY-MM-DD).
 * @returns {Promise<Set<string>>} Set of public holiday dates.
 */
async function buildPublicHolidaysSet(startDate, endDate) {
  const startYear = dayjs(startDate).year();
  const endYear = dayjs(endDate).year();
  const holidaysSet = new Set();

  const years = [];
  for (let year = startYear; year <= endYear; year += 1) {
    years.push(year);
  }

  await Promise.all(
    years.map(async (year) => {
      let yearHolidays = publicHolidaysCache.get(year);
      if (!yearHolidays) {
        try {
          const response = await axios.get(`https://calendrier.api.gouv.fr/jours-feries/metropole/${year}.json`, {
            timeout: 10000,
          });
          yearHolidays = Object.keys(response.data);
          publicHolidaysCache.set(year, yearHolidays);
        } catch (error) {
          logger.warn(`Failed to fetch French public holidays for ${year}: ${error.message}`);
          yearHolidays = [];
        }
      }
      yearHolidays.forEach((date) => holidaysSet.add(date));
    }),
  );

  return holidaysSet;
}

module.exports = {
  buildPublicHolidaysSet,
};
