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
            type: 'integer',
            required: true
        },

        country: {
            type: 'string',
            required: true
        },

        latitude: {
            type: 'float'
        },

        longitude: {
            type: 'float'
        }

    },

    beforeCreate: function(values, next) {

        // If no latitude and longitude are set, get them

        if (!values.latitude && !values.longitude && sails.config.environment == 'production') {
            var address = values.address + ' ' + values.postcode + ' ' + values.city + ' ' + values.country;
            AddressToCoordinateService.geocode(address, function(err, latitude, longitude) {
                if (!err) {
                    values.latitude = latitude;
                    values.longitude = longitude;
                }
                next();
            });
        } else {
            next();
        }
    }

};
