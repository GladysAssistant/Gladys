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

module.exports = {

    attributes: {

        name: {
            type: 'string'
        },
        
        uuid:{
            type:'uuid',
            required: true
        },

        house: {
            model: 'House'
        },

        ip: {
            type: 'string'
        }

    }
};
