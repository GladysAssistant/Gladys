// update an alarm

/**
 * @private
 * @description This function update an alarm
 * @name gladys.alarm.update
 * @param {Object} params
 * @param {integer} params.id The id of alarm
 * @param {Object} params.alarm 
 * @param {String} params.alarm.name The name of the alarm
 * @param {datetime} params.alarm.datetime Datetime of the alarm when the alarm is at a specific date
 * @param {time} params.alarm.time Time of the alarm when it's a reccurring alarm
 * @param {integer} params.alarm.dayofweek The day the alarm should ring (reccurring alarm)
 * @returns {Alarm} alarm
 * @example
 * var params = {
 *      id: 1,
 *      alarm = {
 *          name: 'Monday wake up !',
 *          time: '08:00',
 *          dayofweek: 1
 *      }
 * };
 * 
 * gladys.alarm.update(params)
 *      .then(function(alarm){
 *         // alarm updated ! 
 *      })
 *      .catch(function(err){
 *          // something bad happened ! :/
 *      });
 */

module.exports = function(params) {
    return Alarm.update({
            id: params.id
        }, params.alarm)
        .then(function(alarms) {

            if (alarms.length === 0) {
                return Promise.reject(new Error('Alarm not found'));
            }

            if (!alarms[0].active) {
                return gladys.alarm.cancel(alarms[0]);
            } else {

                // re-schedule the alarm
                return gladys.alarm.cancel(alarms[0])
                    .then(() => {
                        return gladys.alarm.schedule(alarms[0]);
                    });
            }
        });
};
