var queries = require('./deviceState.queries.js');

module.exports = function getFilteredMinMax(options){
  return gladys.utils.sql(queries.getFilteredMinMax, [options.devicetype, options.startDate, options.endDate]);
};
