const AuthMiddleware = require('./authMiddleware');
const adminMiddleware = require('./adminMiddleware');

module.exports = function AuthenticatedOrNotConfiguredMiddleware(scope, gladys, adminOnly = true) {
  const authMiddleware = AuthMiddleware(scope, gladys);
  return (req, res, next) => {
    // When the instance is not configured yet (no user in database), the route is
    // accessible without authentication. This allows the signup flow to restore a
    // Gladys Plus backup without having to create a local account first.
    // This is not less secure than the current state: as long as no user exists,
    // anyone with network access can call POST /api/v1/signup and become admin.
    if (gladys.user.getUserCount() === 0) {
      next();
      return;
    }
    // Otherwise, the route requires an authenticated user, and an admin one
    // unless the route explicitly opted out of the admin check.
    authMiddleware(req, res, (authError) => {
      if (authError) {
        next(authError);
        return;
      }
      if (!adminOnly) {
        next();
        return;
      }
      try {
        adminMiddleware(req, res, next);
      } catch (e) {
        next(e);
      }
    });
  };
};
