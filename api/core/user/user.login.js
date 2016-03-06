var bcrypt = require('bcrypt');
var Promise = require('bluebird');
var compareHash = Promise.promisify(bcrypt.compare);
var queries = require('./user.queries.js');

module.exports = function login (params){
    
    // get user by email
    return gladys.utils.sqlUnique(queries.getByEmail, [params.email])
        .then(function(user){

            // compare password and hash
            return [compareHash(params.password, user.password), user];
        })
        .spread(function(valid, user){
            if(!valid){
                return Promise.reject(new Error('Unauthorized'));
            }
            
            // generate JsonWebToken
            return [gladys.user.generateToken(user), user];
        })
        .spread(function(token, user){
            
           user.token = token;
           delete user.password;
           return Promise.resolve(user); 
        });
};