


module.exports = {
  
  
  index: function(req, res, next){
      gladys.deviceState.get(req.query)
         .then(function(states){
             return res.json(states);
         })
         .catch(next);
  }
    
};