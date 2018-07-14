
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
    
    installation: function(req, res, next){
        res.view('installation/index', {
            layout: null
        });
    }
};