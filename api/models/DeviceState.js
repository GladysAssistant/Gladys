/**
 * DeviceState.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

   /**
 * @public
 * @name DeviceState
 * @class
 */

module.exports = {

    attributes: {

        value: {
            type: 'float',
            required: true
        },

        datetime: {
            type: 'datetime',
            required: true
        },

        devicetype:  {
            model: 'DeviceType',
            required: true
        }

    },

    beforeValidate: function(values, cb) {
        // If no datetime is set, set to actual time
        if (!values.datetime) {
            values.datetime = new Date();
        }
        cb();
    }
};
