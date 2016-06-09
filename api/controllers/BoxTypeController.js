

module.exports = {
  
  
  /**
   * Get all boxTypes
   */
  index: function(req, res, next){
      gladys.boxType.getAll()
        .then(function(types){
            return res.json(types);
        })
        .catch(next);
  }
    
};