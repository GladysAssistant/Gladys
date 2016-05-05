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
        gladys.state.create(req.body)
          .then(function(state){
              return res.status(201).json(state);
          })
          .catch(next);
    },  
    
    delete: function(req, res, next){
        gladys.state.delete({id: req.params.id})
          .then(function(){
              return res.json({success: true});
          })
          .catch(next);
    },
    
    update: function(req, res, next){
        req.body.id = req.params.id;
        gladys.state.update(req.body)
          .then(function(state){
              return res.json(state);
          })
          .catch(next);
    }
};

