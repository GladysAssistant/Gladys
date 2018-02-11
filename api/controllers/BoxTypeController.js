

module.exports = {
  
  
  /**
   * Get all boxTypes
   */
  index: function(req, res, next){
      gladys.boxType.getAll()
        .then((types) => {
            
            // translate box title
            types.forEach((type) => {
              type.title = req.__(`box-${type.title}-title`);
            });

            return res.json(types);
        })
        .catch(next);
  }
    
};