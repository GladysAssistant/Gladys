/** 
 * Gladys Project
 * http://gladysproject.com
 * Software under licence Creative Commons 3.0 France 
 * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
 * You may not use this software for commercial purposes.
 * @author :: Pierre-Gilles Leymarie
 */

/**
 * Notification.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

 /**
 * @public
 * @name Notification
 * @class
 */

module.exports = {

    attributes: {

        title: {
            type: 'string',
            required: true
        },

        text: {
            type: 'string',
            required: true
        },

        link: {
            type: 'string'
        },

        priority: {
            type: 'integer',
            min: -2,
            max: 2,
            defaultsTo: 0
        },

        isRead: {
            type: 'boolean',
            defaultsTo: false
        },

        icon: {
            type: 'string',
            required: true
        },

        iconColor: {
            type: 'string',
            required: true
        },

        user: {
            model: 'User',
            required: true
        }

    }
};
