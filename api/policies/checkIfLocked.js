
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