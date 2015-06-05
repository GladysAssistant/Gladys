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

  if(req.session.User)
  {
      User.findOne(req.session.User.id, function foundUser(err, user) {

          if (user) {
              // User exist
              next();

          } else {

            // user does not exist
            // Wipe out the session (log out)
            req.session.destroy();

            // Redirect the browser to the sign-in screen
            res.redirect('/login');
          }
      }); 
  }
  else
  {
      res.redirect('/login');
  }
  
};