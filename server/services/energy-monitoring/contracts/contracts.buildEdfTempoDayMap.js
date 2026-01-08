const dayjs = require('dayjs');
const utc = require('dayjs/plugin/utc');
const timezone = require('dayjs/plugin/timezone');
const { LRUCache } = require('lru-cache');
const logger = require('../../../utils/logger');

dayjs.extend(utc);
dayjs.extend(timezone);

// LRU cache configuration
// - max: 1000 days (covers ~2.7 years of historical data)
// - ttl: 48 hours (172800000 ms) - cache expires after 2 days
const edfTempoCache = new LRUCache({
  max: 1000,
  ttl: 1000 * 60 * 60 * 48, // 48 hours
});

const buildEdfTempoDayMap = async (gladys, startDate) => {
  logger.info(`Building EDF tempo historical map from ${startDate}`);
  const edfTempoHistoricalMap = new Map();

  // Generate all dates from startDate to today (in Europe/Paris timezone)
  const today = dayjs()
    .tz('Europe/Paris')
    .format('YYYY-MM-DD');

  const start = dayjs(startDate).tz('Europe/Paris');
  const end = dayjs(today).tz('Europe/Paris');
  const daysToFetch = [];
  let allDaysInCache = true;

  // Check which days are in cache
  let currentDate = start;
  while (currentDate.isBefore(end) || currentDate.isSame(end, 'day')) {
    const dateKey = currentDate.format('YYYY-MM-DD');
    const cachedDayType = edfTempoCache.get(dateKey);

    if (cachedDayType !== undefined) {
      // Day found in cache, add to result map
      edfTempoHistoricalMap.set(dateKey, cachedDayType);
    } else {
      // Day not in cache, mark for API fetch
      allDaysInCache = false;
      daysToFetch.push(dateKey);
    }

    currentDate = currentDate.add(1, 'day');
  }

  // If all days are in cache, return immediately without API call
  if (allDaysInCache) {
    logger.info(`All ${edfTempoHistoricalMap.size} EDF tempo days found in cache (from ${startDate} to ${today})`);
    return edfTempoHistoricalMap;
  }

  // Fetch missing days from API
  logger.info(
    `Fetching ${daysToFetch.length} missing EDF tempo days from API (${edfTempoHistoricalMap.size} days from cache)`,
  );
  const edfTempoHistorical = await gladys.gateway.getEdfTempoHistorical(startDate, 1000000);

  // Process API results and update cache
  edfTempoHistorical.forEach((day) => {
    edfTempoHistoricalMap.set(day.created_at, day.day_type);
    // Store in cache with date as key
    edfTempoCache.set(day.created_at, day.day_type);
  });

  if (edfTempoHistorical.length > 0) {
    logger.info(
      `Found ${edfTempoHistoricalMap.size} EDF tempo historical days (${
        edfTempoHistorical.length
      } from API, ${edfTempoHistoricalMap.size - edfTempoHistorical.length} from cache). Most recent date: ${
        edfTempoHistorical[edfTempoHistorical.length - 1].created_at
      }`,
    );
  } else {
    logger.info('No EDF tempo historical days returned from API');
  }

  return edfTempoHistoricalMap;
};

module.exports = {
  buildEdfTempoDayMap,
};
