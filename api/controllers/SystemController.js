

module.exports = {
    
    index: function(req, res, next){
        gladys.system.getInfos()
          .then(function(infos){
              return res.json(infos);
          })
          .catch(next);
    },
    
    shutdown: function(req, res, next){

        // we must answer before shutting down gladys :p
        res.json({success: true});
        gladys.system.shutDown();
    },

    update: function(req, res, next){

        // we must answer before starting update process
        res.json({success: true});
        gladys.system.update();
    },

    healthCheck: function(req, res, next){
        return res.json({success: true});
    }
}