/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * Allow any authenticated user.
 */
module.exports = function(req, res, next) {

  // User is allowed, proceed to controller
  if (req.session.User) {
    return next();
  }
  else { // User is not allowed
    return res.redirect('/login');
  }
};