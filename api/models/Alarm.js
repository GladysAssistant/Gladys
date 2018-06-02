/** 
 * Gladys Project
 * http://gladysproject.com
 * Software under licence Creative Commons 3.0 France 
 * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
 * You may not use this software for commercial purposes.
 * @author :: Pierre-Gilles Leymarie
 */

/**
 * Alarm.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

 /**
 * @public
 * @name Alarm
 * @class
 */

module.exports = {

    types: {
        // new time type because time does not exist in sails
        time: function(time) {
            var re = /^[0-2]\d:[0-5]\d$/;
            return (time !== '' && time.match(re));
        },
    },

    attributes: {

        name: {
            type: 'string',
            required: true
        },

        // if define by datetime
        datetime: {
            type: 'datetime'
        },

        // or just by recurring + time
        time: {
            type: 'string',
            time: true,
        },
        // going from 0 = Sunday
        // to 6 = Saturday
        dayofweek: {
            type: 'integer',
            min: -1,
            max: 6,
            defaultsTo: -1
        },

        cronrule: {
            type: 'string'
        },

        autoWakeUp: {
            type: 'boolean',
            defaultsTo: false
        },

        active: {
            type: 'boolean',
            defaultsTo: true
        },

        // determine if this alarm is an alarm for wake up or not
        isWakeUp: {
            type: 'boolean',
            defaultsTo: false
        },

        user: {
            model: 'User',
            required: true
        }

    }
};
