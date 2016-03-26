var Promise = require('bluebird');

module.exports = function(user){
    var id = user.id;
    delete user.id;
    return User.update({id}, user)
      .then(function(users){
          if(users.length === 0){
              return Promise.reject(new Error('NotFound'));
          } else {
             return Promise.resolve(users[0]);    
          }
      });
};