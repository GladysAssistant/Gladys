const queries = require('./user.queries.js');
const bcrypt = require('bcrypt');

const EXPIRATION_TIME_IN_MINUTE = 120;

module.exports = function(newPassword, token) {
    var userId;
    return gladys.utils.sqlUnique(queries.getParamUserByValue, [token])
        .then((paramUser) => {

            if((new Date().getTime() - new Date(paramUser.updatedAt).getTime()) > EXPIRATION_TIME_IN_MINUTE*60*1000){
                return Promise.reject(new Error('LINK_EXPIRED'));
            } 

            userId = paramUser.user;

            return [User.update({id: userId}, {password: newPassword}), paramUser]
        })
        .spread((usersUpdated, paramUser) => {
            if(usersUpdated.length === 0) {
                return Promise.reject(new Error('USER_NOT_FOUND'));
            }
            userUpdated = usersUpdated[0];
            delete userUpdated.password;
            return [userUpdated, gladys.paramUser.delete({name: paramUser.name, user: paramUser.user})];
        })
        .spread((userUpdated) => userUpdated);
};