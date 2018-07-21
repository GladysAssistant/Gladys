
/**
 * @apiDefine authenticated Connected user only
 * Allow only a connected user to pass
 */

module.exports = function(req, res, next) {

  // User is allowed, proceed to controller
  if (req.session.authenticated) {
    return next();
  }
  else { // User is not allowed
    return res.redirect('/login');
  }
};