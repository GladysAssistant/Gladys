/** 
 * Gladys Project
 * http://gladysproject.com
 * Software under licence Creative Commons 3.0 France 
 * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
 * You may not use this software for commercial purposes.
 * @author :: Pierre-Gilles Leymarie
 */

/**
 * House.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

    /**
 * @public
 * @name House
 * @class
 */

module.exports = {

    attributes: {

        uuid: {
            type: 'uuid',
            required: true,
            unique: true
        },

        name: {
            type: 'string',
            required: true
        },

        address: {
            type: 'string',
            required: true
        },

        city: {
            type: 'string',
            required: true
        },

        postcode: {
            type: 'string',
            required: true
        },

        country: {
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
        }

    }

};
