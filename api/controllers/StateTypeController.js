/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * StateTypeController
 *
 * @description :: Server-side logic for managing Statetypes
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    
    index: function(req, res, next){
        gladys.stateType.get()
          .then(function(stateTypes){
              return res.json(stateTypes);
          })
          .catch(next);
    },
    
    getStateParams: function(req, res, next){
        
        gladys.stateParam.getByStateType({statetype: req.params.id})
          .then(function(stateParams){
              return res.json(stateParams);
          })
          .catch(next);
    }
	
};

