/**
 * DeviceType.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

    /**
 * @public
 * @name DeviceType
 * @class
 */

module.exports = {

    attributes: {

        name: {
          type: 'string'  
        },

        // binary, multilevel. Useful for display in views
        type: {
            type: 'string',
            required: true
        },

        // ex: "light", "tv"
        // useful for gladys if you ask "turn on the lights in the living room"
        // that she need to select all "binary" that are not sensors, that are categorized 
        // as "light" and that are in the living room.
        category: {
            type: 'string'
        },

        // can be useful to identify a devicetype (ex: unique ID of a part of a device)
        identifier: {
          type: 'string'  
        },
        
        // the name of the deviceType for 
        // text recognition
        tag: {
          type: 'string'
        },
        
        // true if the devicetype is a sensor
        sensor: {
            type: 'boolean',
            required: true
        },

        unit: {
            type: 'string'
        },

        min: {
            type: 'integer',
            required: true
        },

        max: {
            type: 'integer',
            required: true
        },
        
        // if the deviceType should be displayed in view
        display: {
          type:'boolean',
          defaultsTo: true  
        },

        lastValue: {
            type: 'float'
        },

        lastValueDatetime: {
            type: 'datetime'
        },

        device: {
            model: 'Device',
            required: true
        }

    }
};
