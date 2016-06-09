
module.exports = function create (user){
    
    // creating in DB the user
  return User.create(user)
    .then(function(user){
    
        // remove password from user object
        delete user.password;
        
        // generating a JsonWebToken
        return [gladys.user.generateToken(user), user];
    })
    .spread(function(token,user){
       user.token = token;
       return Promise.resolve(user); 
    });
};