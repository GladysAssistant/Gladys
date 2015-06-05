/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
/**
 * sessionAuth
 *
 * @module      :: Policy
 * @description :: 
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {

  // User is allowed, proceed to the next policy, 
  // or if this is the last policy, the controller
  Session.findOne()
  .where({ cookie: req.session.hash })
  .where({ expiration: { '>' : new Date() } })
  .exec(function foundSession(err, session) {
  		if (err) return next(err);

  		if (!session) {
				  return res.redirect('/login');
		  }
  		else
  		{
  			  sails.log.info("authenticated " + req.session.hash);
  			  return next();
  		}

  });


};
