/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
module.exports = function(req, res, next) {

  // if user is a Human (means that it is not a connected object accessing via a token)
  if(req.session.authenticated && req.session.trueHuman) {
  	UserService.isSleeping(req.session.User.id, function(err, isSleeping){
  		if(err) return sails.log.warn(err);

  		// and user is sleeping
  		if(isSleeping){
  			// it means that the user is connecting to dashboard, so the user is awake!
  			UserService.wakeUp(req.session.User.id, function(err){
  				if(err) return sails.log.warn(err);
  			});
  		}
  	});
  }

  next();
};