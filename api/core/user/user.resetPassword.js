const queries = require('./user.queries.js');
const bcrypt = require('bcrypt');

const EXPIRATION_TIME_IN_MINUTE = 120;

module.exports = function(newPassword, token) {
    var userId;
    return gladys.utils.sqlUnique(queries.getParamUserByValue, [token])
        .then((paramUser) => {
            if((new Date() - paramUser.createdAt) > EXPIRATION_TIME_IN_MINUTE*60*1000){
                return Promise.reject(new Error('LINK_EXPIRED'));
            } 

            userId = paramUser.user;

            return hashPassword(newPassword);            
        })
        .then((hash) => {
            return User.update({id: userId}, {password: hash});
        });
};

function hashPassword(password) {
    return new Promise(function(resolve, reject){
        bcrypt.hash(password, 10, function passwordEncrypted(err, encryptedPassword) {
            if (err) return reject(err);
            
            resolve(encryptedPassword);
        });
    });
}