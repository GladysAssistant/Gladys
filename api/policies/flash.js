/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
  
module.exports = function(req, res, next) {

 res.locals.flash = {};

 if(!req.session.flash) return next();

 res.locals.flash = _.clone(req.session.flash);

 // clear flash
 req.session.flash = {};

 next();
};