const queries = require('./location.queries');

/**
 * @public
 * @description This function return all locations between two dates
 * @name gladys.location.getBydateRange
 * @returns {Array<locations>} locations
 * @example
 * gladys.lacation.getByRange({start: {Date}, end: {Date})
 *      .then(function(locations){
 *          // do something
 *      })
 */

module.exports = function getByDateRange(dates){
  return gladys.utils.sql(queries.getEveryLocationUserBetweenDates, [dates.start, dates.end]);
};
