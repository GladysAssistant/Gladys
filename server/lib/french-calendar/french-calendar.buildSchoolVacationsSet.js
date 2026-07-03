const axios = require('axios');
const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { LRUCache } = require('lru-cache');
const logger = require('../../utils/logger');

dayjs.extend(utc);
dayjs.extend(timezone);

const schoolVacationsCache = new LRUCache({
  max: 50,
  ttl: 1000 * 60 * 60 * 24 * 7,
});

const SCHOOL_VACATION_ZONES = ['Zone A', 'Zone B', 'Zone C', 'Corse'];

/**
 * @description Build a set of French school vacation dates (YYYY-MM-DD) for a zone.
 * Uses the official education.gouv.fr open data API.
 * @param {string} startDate - Start date (YYYY-MM-DD).
 * @param {string} endDate - End date (YYYY-MM-DD).
 * @param {string} zone - School vacation zone (e.g. "Zone A").
 * @returns {Promise<Set<string>>} Set of school vacation dates.
 */
async function buildSchoolVacationsSet(startDate, endDate, zone) {
  if (!zone || !SCHOOL_VACATION_ZONES.includes(zone)) {
    return new Set();
  }

  const cacheKey = `${zone}:${startDate}:${endDate}`;
  const cached = schoolVacationsCache.get(cacheKey);
  if (cached) {
    return cached;
  }

  const vacationsSet = new Set();

  try {
    const where = `zones = "${zone}" AND end_date >= "${startDate}" AND start_date <= "${endDate}"`;
    const url = `https://data.education.gouv.fr/api/explore/v2.1/catalog/datasets/fr-en-calendrier-scolaire/records?where=${encodeURIComponent(
      where,
    )}&limit=100`;

    const response = await axios.get(url, { timeout: 10000 });
    const results = response.data.results || [];

    results.forEach((period) => {
      let current = dayjs(period.start_date).tz('Europe/Paris').startOf('day');
      const end = dayjs(period.end_date).tz('Europe/Paris').startOf('day');

      while (current.isBefore(end) || current.isSame(end, 'day')) {
        vacationsSet.add(current.format('YYYY-MM-DD'));
        current = current.add(1, 'day');
      }
    });

    schoolVacationsCache.set(cacheKey, vacationsSet);
  } catch (error) {
    logger.warn(`Failed to fetch French school vacations for ${zone}: ${error.message}`);
  }

  return vacationsSet;
}

module.exports = {
  buildSchoolVacationsSet,
  SCHOOL_VACATION_ZONES,
};
