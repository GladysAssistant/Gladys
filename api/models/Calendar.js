/** 
 * Gladys Project
 * http://gladysproject.com
 * Software under licence Creative Commons 3.0 France 
 * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
 * You may not use this software for commercial purposes.
 * @author :: Pierre-Gilles Leymarie
 */

/**
 * CalendarList.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

  /**
 * @public
 * @name Calendar
 * @class
 */

module.exports = {

    attributes: {

        externalid: {
            type: 'string',
            required: true,
            unique: true
        },

        name: {
            type: 'string'
        },

        description: {
            type: 'string'
        },

        service: {
            type: 'string'
        },

        active: {
            type: 'boolean',
            defaultsTo: true
        },

        user: {
            model: 'User',
            required: true
        }

    }
};
