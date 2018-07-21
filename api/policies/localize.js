
module.exports = function(req, res, next){
    
    if(req.session.User && req.session.User.language) {
        var newLanguage = req.session.User.language.substr(0, 2).toLowerCase();

        // set language for the response
        req.setLocale(newLanguage);
    }

    next();
};