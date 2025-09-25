const buildEdfTempoDayMap = async (gladys, startDate) => {
  const edfTempoHistoricalMap = new Map();
  const edfTempoHistorical = await gladys.gateway.getEdfTempoHistorical(startDate, 100000);
  edfTempoHistorical.forEach((day) => {
    edfTempoHistoricalMap.set(day.created_at, day.day_type);
  });
  return edfTempoHistoricalMap;
};

module.exports = {
  buildEdfTempoDayMap,
};
