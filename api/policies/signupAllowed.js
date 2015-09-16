/**
 * If signup is allowed, go to controller
 * if not, fordidden
 */
		
		
module.exports = function(req, res, next) {
	if(!sails.config.signup.active){
			return res.forbidden('Signup not active');
	}else{
		next();
	}		
};