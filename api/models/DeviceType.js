/**
 * DeviceType.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

module.exports = {

    attributes: {

        name: {
          type: 'string'  
        },

        type: {
            type: 'string',
            required: true
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

        device: {
            model: 'Device',
            required: true
        }

    }
};
