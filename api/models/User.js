
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
        
        if(values.password.length < 8){
            return next('PASSWORD_SIZE_TOO_LOW');
        }

        bcrypt.hash(values.password, 10, function passwordEncrypted(err, encryptedPassword) {
            if (err) return next(err);
            values.password = encryptedPassword;

            next();
        });
    },

    beforeUpdate: function(values, next){

        if(values.password) {
        
            if(values.password.length < 8) {
                return next('PASSWORD_SIZE_TOO_LOW');
            }

            bcrypt.hash(values.password, 10, function passwordEncrypted(err, encryptedPassword) {
                if (err) return next(err);
                values.password = encryptedPassword;

                next();
            });
        } else {
            next();
        }
    }

};
