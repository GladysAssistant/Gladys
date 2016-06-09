/**
 * If signup is allowed, go to controller
 * if not, fordidden
 */
		
		
module.exports = function(req, res, next) {
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