/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * checkToken
 *
 * @module      :: Policy
 * @description :: Simple policy to allow a valid token
 * @docs        :: http://sailsjs.org/#!documentation/policies
 *
 */
module.exports = function(req, res, next) {
  // if user is already authenticated, proceed to controller
  if (req.session.authenticated && req.session.User) {
    return next();
  }
  // if no token is given, redirect
  if(!req.param('token'))
      return res.redirect('/login');

  // find token in the database
  Token.findOne()
  .where({ value : req.param('token') })
  .where({ status : true })
  .populate('user')
  .exec(function foundToken(err, token) {
  		if (err) return res.forbidden('Access denied. Error while finding token');

  		if (!token)
				return res.forbidden('Access denied.');
		else{
			sails.log.info("Access with token : " + req.param('token'));
      req.session.User = token.user;
      req.session.authenticated = true;
      req.session.trueHuman = false;
			return next();
		}

  });


};
