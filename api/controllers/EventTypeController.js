

module.exports = {
  
  index: function(req, res, next){
      
  },
  
  /**
   * Retrieve all launcherParams from a specific eventType
   */
  getLauncherParams: function(req, res, next){
    gladys.launcherParam.getByEventType({eventType: req.params.id})
      .then(function(launcherParams){
          return res.json(launcherParams);
      })  
      .catch(next);
  },
    
};