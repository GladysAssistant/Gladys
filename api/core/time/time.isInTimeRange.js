const moment = require('moment');
const Promise = require('bluebird');

/**
 * @public
 * @description This function return true or false if current time is in the provided time range
 * @name gladys.time.isInTimeRange
 * @param {Object} option
 * @param {string} option.start Beginning of the interval for validation (HH:MM:SS)
 * @param {string} option.end End of the interval for validation (HH:MM:SS)
 * @returns {boolean} isInTimeRange
 * 
 * @example
 * 
 * var option = {
 *	start: '10:00:00',
 *	end: '15:00:00'
 * };
 * 
 * gladys.time.isInTimeRange(option)
 *      .then(function(isInTimeRange){
 *          if(isInTimeRange){
 *              //The time is within the given range.
 *          }else{
 *              //The time is not in the given range.
 *          }
 *      });
 */

module.exports = function isInTimeRange(options){

    var now = new Date();

    var arrayOfSart = options.start.split(":");
    var arrayOfEnd = options.end.split(":");

    // default start time 00:00:00
    var startDate = new Date();
    startDate.setHours(arrayOfSart[0] || 0);
    startDate.setMinutes(arrayOfSart[1] || 0);
    startDate.setSeconds(arrayOfSart[2] || 0);

    
    // end time default is the end of the day
    var endDate = new Date();
    endDate.setHours(arrayOfEnd[0] || 23);
    endDate.setMinutes(arrayOfEnd[1] || 59);
    endDate.setSeconds(arrayOfEnd[2] || 59);

    if(now >= startDate && now <= endDate) return Promise.resolve(true);
	return Promise.resolve(false);
};
