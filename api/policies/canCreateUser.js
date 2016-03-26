/**
 * If signup is allowed, go to controller
 * if not, fordidden
 */
		
		
module.exports = function(req, res, next) {
    
    if(req.session.authenticated && req.session.User){
        if(req.session.User.role === 'admin'){
            return next();
        } else {
            return res.forbidden('You are not admin, you can\'t create users');
        }
    }
    
	gladys.utils.sql('SELECT * FROM user;')
      .then(function(users){
         if(users.length === 0){
             next();
         } else {
             return res.forbidden('Signup not allowed');
         }
      })
      .catch(next);
};