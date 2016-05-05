/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */

module.exports = {
  
  
  index: function(req, res, next){
     gladys.launcher.get({user: req.session.User})
       .then(function(launchers){
         return res.json(launchers);
       })
       .catch(next);
  },
  
  
  getActions: function(req, res, next){
    gladys.launcher.getActions({id: req.params.id})
      .then(function(actions){
        return res.json(actions);
      })
      .catch(next);
  },
  
  getStates: function(req, res, next){
    gladys.launcher.getStates({id: req.params.id})
      .then(function(states){
        return res.json(states);
      })
      .catch(next);
  },
  
  

};

