/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * SessionController
 *
 * @module      :: Controller
 * @description	:: 
 * @docs        :: http://sailsjs.org/#!documentation/controllers
 */

var bcrypt = require('bcrypt');
var crypto = require('crypto');

module.exports = {

	/**
	 * Description
	 * @method new
	 * @param {} req
	 * @param {} res
	 * @return
	 */
	newUser: function(req, res,next) {
		res.view('user/new', {
			layout: null
		});
	},

	/**
	 * Create a user
	 * @method create
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return
	 */
	createUser: function(req, res, next) {
		var userObj = {
			firstname: req.param('firstname'),
			lastname: req.param('lastname'),
			email: req.param('email'),
			birthdate: req.param('birthdate'),
			password: req.param('password'),
			confirmation: req.param('confirmationPassword'),
			gender: req.param('gender'),
			language: req.param('language')
		};

		User.create(userObj, function userCreated(err, user) {
			if (err) {
				req.flash('error', err);
				return res.redirect('/register');
			}
			
			return res.redirect('/login');
		});


	},
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

			var usernamePasswordRequiredError = [{
				name: 'usernamePasswordRequired',
				message: 'You must enter both a username and password.'
			}];

			req.flash('error', usernamePasswordRequiredError);
			return res.redirect('/login');
		}

		// Try to find the user by there email address. 
		// findOneByEmail() is a dynamic finder in that it searches the model by a particular attribute.
		// User.findOneByEmail(req.param('email')).done(function(err, user) {
		User.findOneByEmail(req.param('email'), function foundUser(err, user) {
			if (err) return next(err);

			// If no user is found...
			if (!user) {
				var noAccountError = [{
					name: 'noAccount',
					message: 'The email address ' + req.param('email') + ' not found.'
				}];

				req.flash('error', noAccountError);

				return res.redirect('/login');
			}


			// Compare password from the form params to the encrypted password of the user found.
			bcrypt.compare(req.param('password'), user.password, function(err, valid) {
				if (err) return next(err);

				// If the password from the form doesn't match the password from the database...
				if (!valid) {
					var usernamePasswordMismatchError = [{
						name: 'usernamePasswordMismatch',
						message: 'Invalid username and password combination.'
					}];
					req.flash('error', usernamePasswordMismatchError);
					res.redirect('/login');
					return;
				}

				// Log user in
				req.session.User = user;
				req.session.authenticated = true;
				req.session.trueHuman = true;
				user.online = true;

				// 
				sails.log.info("New User connected : " + user.fullname());
				// 
				user.save(function(err, user) {
					if (err) return next(err);
					
					if(user.preparationTimeAfterWakeUp){
						res.redirect('/dashboard');
					}else{
						res.redirect('/dashboard/installation');
					}
				});
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