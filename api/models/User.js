/** 
 * Gladys Project
 * http://gladysproject.com
 * Software under licence Creative Commons 3.0 France 
 * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
 * You may not use this software for commercial purposes.
 * @author :: Pierre-Gilles Leymarie
 */

/**
 * User.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/#!documentation/models
 */

var bcrypt = require('bcrypt');

module.exports = {

    attributes: {

        firstname: {
            type: 'string',
            required: true
        },

        lastname: {
            type: 'string',
            required: true
        },

        email: {
            type: 'email',
            required: true,
            unique: true
        },

        birthdate: {
            type: 'date',
            required: true
        },

        gender: {
            type: 'integer',
            required: true
        },

        language: {
            type: 'string',
            maxLength: 5,
            required: true
        },

        password: {
            type: 'string',
            required: true
        },

        assistantName: {
            type: 'string',
            defaultsTo: 'Gladys'
        },

        // type to prepare after waking up 
        // to go working for example
        preparationTimeAfterWakeUp: {
            type: 'integer'
        },
        
        // the role of the user
        role: {
            type:'string',
            enum: ['admin', 'habitant', 'guest'],
            required: true
        }

    },

    beforeCreate: function(values, next) {
        
        if(values.password.length < 5){
            return next('Password is too short');
        }

        bcrypt.hash(values.password, 10, function passwordEncrypted(err, encryptedPassword) {
            if (err) return next(err);
            values.password = encryptedPassword;

            next();
        });
    }

};
