
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
        
        gladys.module.install(req.body);

        return res.json({message: 'Installation started with success'});
    },
    
    
    config: function(req, res, next){
        gladys.module.config({slug: req.params.slug})
          .then(function(){
              return res.json({success: true});
          })
          .catch(next);
    },
    
    uninstall: function(req, res, next){
        gladys.module.uninstall({id: req.params.id})
          .then(function(module){
              return res.json(module);
          })
          .catch(next);
    },

    upgrade: function(req, res, next){
        gladys.module.upgrade({id: req.params.id, version: req.body.version});
        return res.json({message: 'Upgrade started with success'});
    }
	
};

