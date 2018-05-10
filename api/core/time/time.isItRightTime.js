const moment = require('moment');
const Promise = require('bluebird');

/**
 * @public
 * @description This function return true or false is it the right time
 * @name gladys.time.isItRightTime
 * @param {Object} option
 * @param {string} option.start Beginning of the interval for validation (HH:MM:SS)
 * @param {string} option.end End of the interval for validation (HH:MM:SS)
 * @returns {Time} time
 * 
 * @example
 * var option = {
 *      start: '10:00:00', 
 *	end: '15:00:00'
 * };
 * 
 * gladys.time.isItRightTime(option)
 *      .then(function(isItTime){
 *          if(isItTime){
 *              //The time is within the given range.
 *          }else{
 *              //The time is not in the given range.
 *          }
 *      });
 */

module.exports = function isItRightTime(options){

    var now = new Date();

    var arrayOfSart = options.start.split(":");
    var arrayOfEnd = options.end.split(":");

    // default start time 00:00:00
    var date = new Date();
    date.setHours(arrayOfSart[0] || 0);
    date.setMinutes(arrayOfSart[1] || 0);
    date.setSeconds(arrayOfSart[2] || 0);

    
    // end time default is the end of the day
    var endDate = new Date();
    endDate.setHours(arrayOfEnd[0] || 23);
    endDate.setMinutes(arrayOfEnd[1] || 59);
    endDate.setSeconds(arrayOfEnd[2] || 59);

    // settings default options if not defined
    options = options || {};
    options.start = date;
    options.end = endDate;

    if(now >= date && now <= endDate) return true;
	return false;
};
