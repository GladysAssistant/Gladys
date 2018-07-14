var bcrypt = require('bcrypt');
var jwt = require('jsonwebtoken');

module.exports = {
    
	/**
	 * Description
	 * @method create
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return
	 */
	create: function(req, res, next) {
		// Check for email and password in params sent via the form, if none
		// redirect the browser back to the sign-in form.
		if (!req.param('email') || !req.param('password')) {

			req.flash('error', req.__('login-error-password-email-required'));
			return res.redirect('/login');
		}

		// Try to find the user by there email address. 
		// findOneByEmail() is a dynamic finder in that it searches the model by a particular attribute.
		// User.findOneByEmail(req.param('email')).done(function(err, user) {
		User.findOneByEmail(req.param('email'), function foundUser(err, user) {
			if (err) return next(err);

			// If no user is found...
			if (!user) {
				

				req.flash('error', req.__('login-error-invalid-email'));
				return res.redirect('/login');
			}


			// Compare password from the form params to the encrypted password of the user found.
			bcrypt.compare(req.param('password'), user.password, function(err, valid) {
				if (err) return next(err);

				// If the password from the form doesn't match the password from the database...
				if (!valid) {
					req.flash('error', req.__('login-error-invalid-username-password'));
					res.redirect('/login');
					return;
				}

				// Log user in
				req.session.User = user;
				req.session.authenticated = true;
				req.session.trueHuman = true;
				user.online = true;

				// 
				sails.log.info("New User connected : " + user.firstname);
				
                res.redirect('/dashboard');
			});
		});
	},

	/**
	 * Description
	 * @method destroy
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return
	 */
	destroy: function(req, res, next) {

		User.findOne(req.session.User.id, function foundUser(err, user) {

			var userId = req.session.User.id;

			if (user) {
				// The user is "logging out" (e.g. destroying the session) so change the online attribute to false.
				User.update(userId, {
					online: false
				}, function(err) {
					if (err) return next(err);

					// Inform other sockets (e.g. connected sockets that are subscribed) that the session for this user has ended.
					/*User.publishUpdate(userId, {
						loggedIn: false,
						id: userId,
						name: user.name,
						action: ' has logged out.'
					});*/

					// Wipe out the session (log out)
					req.session.authenticated = false;
					req.session.destroy();
					// Redirect the browser to the sign-in screen
					res.redirect('/login');
				});
			} else {
				// Wipe out the session (log out)
				req.session.destroy();
				// Redirect the browser to the sign-in screen
				res.redirect('/login');
			}
		});
	}
};