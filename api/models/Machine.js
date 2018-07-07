/** 
 * Gladys Project
 * http://gladysproject.com
 * Software under licence Creative Commons 3.0 France 
 * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
 * You may not use this software for commercial purposes.
 * @author :: Pierre-Gilles Leymarie
 */

/**
 * Machine.js
 *
 * @description :: A Machine represent a instance of Gladys Server. Can be a Master or a Slave.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

 /**
 * @public
 * @name Machine
 * @class
 */

module.exports = {

    attributes: {

        name: {
            type: 'string'
        },
        
        uuid:{
            type:'uuid',
            required: true,
            unique: true
        },

        house: {
            model: 'House'
        },

        room: {
            model: 'Room'
        },

        me: {
            type: 'boolean',
            defaultsTo: false
        },

        lastSeen: {
            type: 'datetime'
        }

    }
};
