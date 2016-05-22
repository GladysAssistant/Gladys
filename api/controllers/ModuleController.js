/**
 * ModuleController
 *
 * @description :: Server-side logic for managing modules
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    
    /**
     * Get all modules
     */
    index: function(req, res, next){
      gladys.module.get()
            .then(function(modules){
                return res.json(modules);
            })  
            .catch(next);
    },
    
    /**
     * Install a given module
     */
    install: function(req, res, next){
        gladys.module.install(req.body)
              .then(function(module){
                  return res.json(module);
              })
              .catch(next);
    },
    
    
    config: function(req, res, next){
        gladys.module.config({slug: req.params.slug})
          .then(function(){
              return res.json({success: true});
          })
          .catch(next);
    }
	
};

