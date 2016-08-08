


module.exports = {
  
  
  index: function(req, res, next){
      gladys.deviceState.get(req.query)
         .then(function(states){
             return res.json(states);
         })
         .catch(next);
  },

  create: function(req, res, next){
      // get or post request are allowed
        var obj;
        if(req.body && req.body.devicetype){
            obj = req.body;
        } else {
            obj = req.query;
        }
      gladys.deviceState.create(obj)
        .then(function(state){
            return res.status(201).json(state);
        })
        .catch(next);
  }
    
};