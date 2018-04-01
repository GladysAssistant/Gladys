/**
 * Area.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

 /**
 * @public
 * @name Area
 * @class
 */

module.exports = {

    attributes: {

        name: {
            type: 'string',
            required: true
        },

        latitude: {
            type: 'float',
            required: true
        },

        longitude: {
            type: 'float',
            required: true
        },

        radius: {
            type: 'float',
            required: true
        },

        user: {
            model: 'User',
            required: true
        }

    }
};
