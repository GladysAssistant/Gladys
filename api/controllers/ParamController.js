

module.exports = {
  
  
  index: function(req, res, next){
      gladys.param.get()
        .then(function(params){
            return res.json(params);
        })
        .catch(next);
  },

  getByModule: function(req, res, next){
    gladys.param.getByModule({id: req.params.id})
      .then((params) => res.json(params))
      .catch(next);
  },

  getByName: function(req, res, next){
    gladys.param.getValue(req.params.name)
        .then((value) => res.json({value}))
        .catch(next);
  },
  
  create: function(req, res, next){
      gladys.param.setValue(req.body)
        .then(function(param){
            return res.status(201).json(param);
        })
        .catch(next);
  },
  
  update: function(req, res, next){
      req.body.name = req.params.name;
      gladys.param.setValue(req.body)
        .then(function(param){
            return res.json(param);
        })
        .catch(next);
  },
  
  delete: function(req, res, next){
      gladys.param.delete({name: req.params.name}) 
       .then(function(){
           return res.json({success: true});
       })
       .catch(next);
  }
    
};