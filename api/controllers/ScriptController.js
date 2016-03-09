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
	 * Get all Scripts
     */
	index: function(req,res,next){
        req.query.user = req.session.User;
		gladys.script.get(req.query)
              .then(function(scripts){
                 return res.json(scripts); 
              })
              .catch(next);
	},
    
    /**
     * Create a script
     */
    create: function(req, res, next){
        gladys.script.create(req.body)
              .then(function(script){
                 return res.json(script); 
              })
              .catch(next);
    },
    
    /**
     * Update a script
     */
    update: function(req, res, next){
        req.body.id = req.params.id;
        gladys.script.update(req.body)
              .then(function(script){
                  return res.json(script);
              })
              .catch(next);
    },
    
    exec: function (req, res, next){
        gladys.script.exec({id: req.params.id})
              .then(function(result){
                  return res.json(result);
              })
              .catch(next);
    }
    
    
    
    
};

