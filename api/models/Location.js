/** 
 * Gladys Project
 * http://gladysproject.com
 * Software under licence Creative Commons 3.0 France 
 * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
 * You may not use this software for commercial purposes.
 * @author :: Pierre-Gilles Leymarie
 */

/**
 * Location.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

/**
 * @public
 * @name Location
 * @class
 */

module.exports = {

    attributes: {

        datetime: {
            type: 'datetime',
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

        altitude: {
            type: 'float'
        },

        accuracy: {
            type: 'float'
        },

        user: {
            model: 'User',
            required: true
        }

    }

};
