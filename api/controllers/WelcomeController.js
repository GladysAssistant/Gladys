
module.exports = {


	/**
	 * Welcome page ( / )
	 * @method index
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return
	 */
	index: function(req, res, next) {
        gladys.utils.sql('SELECT * FROM user;')
          .then(function(users){
             var signupAllowed = (users.length === 0); 
             res.view('welcome/homepage', {
                layout: null,
                signupActive: signupAllowed
             });
          });
	},
	
	/**
	 * Login Page ( /login )
	 * @method index
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return
	 */
	login: function(req, res, next){
		res.view('welcome/index', {
			layout: null,
			signupActive: sails.config.signup.active
		});	
	},

	forgotPassword: function(req, res, next){
		res.view('welcome/forgotpassword', {
			layout: null,
			done: false,
			resetPasswordFailed: (req.query.error == 'true')
		});	
	},

	postForgotPassword: function(req, res, next){

		// we catch any errors, we don't want to tell if a user exist or not
		gladys.user.forgotPassword({email: req.body.email})
			.catch(() => null)
			.then(() => {
				res.view('welcome/forgotpassword', {
					layout: null,
					done: true
				});	
			});
	},

	resetPassword: function(req, res, next) {
		res.view('welcome/resetpassword', {
			layout: null,
			token: req.query.token
		});
	},

	postResetPassword: function(req, res, next){
		gladys.user.resetPassword(req.body.password, req.body.token)
			.then(() => {
				return res.redirect('/login');
			})
			.catch((err) => {
				sails.log.error(err);
				return res.redirect('/forgotpassword?error=true');
			});
	},
    
    installation: function(req, res, next){
        res.view('installation/index', {
            layout: null
        });
    }
};