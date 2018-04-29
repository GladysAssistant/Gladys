
/**
 * @public
 * @description This function create an alarm
 * @name gladys.alarm.create
 * @param {Object} alarm
 * @param {String} alarm.name The name of the alarm
 * @param {datetime} alarm.datetime Datetime of the alarm when the alarm is at a specific date
 * @param {time} alarm.time Time of the alarm when it's a reccurring alarm
 * @param {integer} alarm.dayofweek The day the alarm should ring (reccurring alarm)
 * @returns {Alarm} alarm
 * @example
 * var alarm = {
 *      name: 'Monday wake up !',
 *      time: '08:00',
 *      dayofweek: 1
 * };
 * 
 * gladys.alarm.create(alarm)
 *      .then(function(alarm){
 *          // alarm created !
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function create(alarm) {

    if (!(alarm && ( (alarm.dayofweek && alarm.time) || alarm.cronrule || alarm.datetime || alarm.autoWakeUp)) ){
        return Promise.reject(new Error('Wrong parameters, missing arguments.'));
    }

    // create alarm in db
    return Alarm.create(alarm)
        .then(function(alarm) {

            // if alarm is in the future, active and is not a autoWakeUp, or is a cronrule we schedule the alarm
            if (alarm.active && !alarm.autoWakeUp && (new Date(alarm.datetime) > new Date() || alarm.dayofweek !== -1 || alarm.cronrule)) {

                // schedule the alarm with gladys.schedule
                return gladys.alarm.schedule(alarm);
            } else {
                return Promise.resolve(alarm);
            }
        });
};
