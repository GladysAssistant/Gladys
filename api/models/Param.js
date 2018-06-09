/** 
 * Gladys Project
 * http://gladysproject.com
 * Software under licence Creative Commons 3.0 France 
 * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
 * You may not use this software for commercial purposes.
 * @author :: Pierre-Gilles Leymarie
 */

/**
 * Param.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

 /**
 * @public
 * @name Param
 * @class
 */

module.exports = {

    attributes: {

        name: {
           type:'string',
           required: true,
           unique: true 
        },

        description: {
            type:'string'
        },

        type: {
            type: 'string',
            enum: ['visible', 'hidden', 'secret'],
            defaultsTo: 'visible'
        },

        module: {
            model: 'Module'
        },
        
        value: {
            type:'string',
            required: true
        }

    }
};
