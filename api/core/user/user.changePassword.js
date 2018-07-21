var bcrypt = require('bcrypt');
var Promise = require('bluebird');
var compareHash = Promise.promisify(bcrypt.compare);
var queries = require('./user.queries.js');

module.exports = function(params){

    if(params.newPassword != params.newPasswordRepeat) {
        return Promise.reject(new Error('PASSWORD_DOES_NOT_MATCH'));
    }

    if(params.newPassword.length < 8) {
        return Promise.reject(new Error('PASSWORD_SIZE_TOO_LOW'));
    }

    return gladys.utils.sqlUnique(queries.getAllById, [params.id])
        .then((user) => {

            // compare password and hash
            return [compareHash(params.oldPassword, user.password), user];
        })
        .spread(function(valid, user){
    
            if(!valid){
                return Promise.reject(new Error('OLD_PASSWORD_INVALID'));
            }
            
            // password is hashed in the "models/User.js" file
            return User.update({id: user.id}, {password: params.newPassword});
        })
        .then((userUpdated) => {
            delete userUpdated.password;
            return userUpdated;
        })
}