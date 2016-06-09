

/**
 * Pass if the user is admin
 */
module.exports = function(req, res, next) {
	if(req.session.User && req.session.User.role === 'admin'){
        next();
    } else {
        res.forbidden('You are not admin');
    }
};