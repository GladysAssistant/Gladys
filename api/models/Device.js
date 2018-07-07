/**
 * Device.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

  /**
 * @public
 * @name Device
 * @class
 */

module.exports = {

    attributes: {

        name: {
            type: 'string',
            required: true
        },

        protocol: {
            type: 'string',
            required: true
        },

        service: {
            type: 'string',
            required: true
        },

        // can be useful to identify a device (ex: unique ID of a lamp)
        identifier: {
          type: 'string'  
        },

        room: {
            model: 'Room',
        },

        // The Gladys machine responsible of handling this device
        machine: {
            type: 'uuid'
        },

        // if this device is linked to a user (like a phone/laptop/Smart Watch)
        user: {
            model: 'User'
        }

    }
};
