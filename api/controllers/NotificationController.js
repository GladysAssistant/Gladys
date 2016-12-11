/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  

module.exports = {
    
    
    /**
     * Get notifications with pagination
     */
    index: function(req, res, next){
        req.query.user = req.session.User;
        gladys.notification.get(req.query)
          .then(function(notifications){
              return res.json(notifications);
          })
          .catch(next);
    },

    /**
     * Read notifications from a particular user
     */
    read: function(req, res, next){
        gladys.notification.read(req.session.User)
          .then((notifications) => res.json(notifications))
          .catch(next);
    }
    	
};

