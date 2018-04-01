var queries = require('./alarm.queries.js');

/**
 * @public
 * @description This function delete an alarm
 * @name gladys.alarm.delete
 * @param {Object} alarm
 * @param {integer} alarm.id The id of alarm
 * @returns {Alarm} alarm
 * @example
 * var alarm = {
 *      id: 1,
 * };
 * 
 * gladys.alarm.delete(alarm)
 *      .then(function(alarm){
 *         // alarm deleted ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(alarm) {

    if (!alarm.id) {
        return Promise.reject(new Error('You should provide an id to delete an alarm'));
    }

    // deleting alarm from database
    return gladys.utils.sql(queries.deleteAlarm, [alarm.id])
        .then(function() {

            // cancelling alarm
            return gladys.alarm.cancel(alarm);
        });
};
