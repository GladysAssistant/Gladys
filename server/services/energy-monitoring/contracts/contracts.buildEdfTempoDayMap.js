const logger = require('../../../utils/logger');

const buildEdfTempoDayMap = async (gladys, startDate) => {
  logger.info(`Building EDF tempo historical map from ${startDate}`);
  const edfTempoHistoricalMap = new Map();
  const edfTempoHistorical = await gladys.gateway.getEdfTempoHistorical(startDate, 1000000);
  edfTempoHistorical.forEach((day) => {
    edfTempoHistoricalMap.set(day.created_at, day.day_type);
  });
  if (edfTempoHistorical.length > 0) {
    logger.info(
      `Found ${edfTempoHistoricalMap.size} EDF tempo historical days. Most recent date: ${
        edfTempoHistorical[edfTempoHistorical.length - 1].created_at
      } `,
    );
  } else {
    logger.info('No EDF tempo historical days returned');
  }
  return edfTempoHistoricalMap;
};

module.exports = {
  buildEdfTempoDayMap,
};
