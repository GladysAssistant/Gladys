
var jwt = require('jsonwebtoken');

module.exports = function(req, res, next) {
  
  // if user is already authenticated, proceed to controller
  if (req.session.authenticated && req.session.User) {
    return next();
  }
  
  /*
  DISABLE FOR THE MOMENT
  WE NEED TO GENERATE THE SECRET
  // if the request has a JsonWebToken
  if(req.headers.Authorization){
     
     // verifying the jsonwebtoken
     jwt.verify(req.headers.Authorization, sails.config.jwt.secret, function(err, user) {
       if(err) return next(err);
       
       req.session.User = user;
       return next();
     });   
  } */
  
  if (req.param('token')){
      
      // check if get param 'token' is a valid
      gladys.token.verify(req.param('token'))
        .then(function(user){
           sails.log.info('Access with token to user ' + user.firstname);
           req.session.User = user; 
           return next();
        })
        .catch(function(err){
           sails.log.error(err);
           res.forbidden(); 
        });
  } else {
      return res.forbidden('Unauthorized');
  }
};
