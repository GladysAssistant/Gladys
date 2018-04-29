/** 
 * Gladys Project
 * http://gladysproject.com
 * Software under licence Creative Commons 3.0 France 
 * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
 * You may not use this software for commercial purposes.
 * @author :: Pierre-Gilles Leymarie
 */

/**
 * Room.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

 /**
 * @public
 * @name Room
 * @class
 */

module.exports = {

    attributes: {

        name: {
            type: 'string',
            required: true
        },

        house: {
            model: 'House',
            required: true
        },

        permission: {
            type: 'integer'
        },
        
        zones: {
          collection: 'Zone',
          via: 'rooms'
        }
    }

};
