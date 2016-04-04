/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * StateController
 * @description :: Server-side logic for managing states
 * @help :: See http://links.sailsjs.org/docs/controllers
 * @method haveRights
 * @param {} state
 * @param {} user
 * @param {} callback
 * @return 
 */

module.exports = {
    
    create: function(req, res, next){
        gladys.state.create(state)
          .then(function(state){
              return res.json(state);
          })
          .catch(next);
    }
};

