var Promise = require('bluebird');

module.exports = function(user){
  var id = user.id;
  delete user.id;

  // cannot change password in an update request
  // cannot change his createdAt 
  // cannot change his role
  // should use a specific route with oldPassword verification
  delete user.password;
  delete user.createdAt;
  delete user.role;

  return User.update({id}, user)
    .then(function(users){
      if(users.length === 0){
        return Promise.reject(new Error('NotFound'));
      } else {
        delete users[0].password;
              
        return Promise.resolve(users[0]);    
      }
    });
};