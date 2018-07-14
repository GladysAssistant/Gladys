
module.exports = {
  
  
  index: function(req, res, next){
     gladys.launcher.get({user: req.session.User})
       .then(function(launchers){
         return res.json(launchers);
       })
       .catch(next);
  },
  
  
  create: function(req, res, next){
    req.body.user = req.session.User.id;
    
    gladys.launcher.create(req.body)
      .then(function(launcher){
        return res.status(201).json(launcher);
      })
      .catch(next);
  },
  
  
  delete: function(req, res, next){
    gladys.launcher.delete({id: req.params.id})
      .then(function(){
        return res.json({success: true});
      })
      .catch(next);
  },
  
  
  update: function(req, res, next){
    req.body.id = req.params.id;
    
    gladys.launcher.update(req.body)
      .then(function(launcher){
        return res.json(launcher);
      })
      .catch(next);
  },
  
  getActions: function(req, res, next){
    gladys.launcher.getActions({id: req.params.id})
      .then(function(actions){
        return res.json(actions);
      })
      .catch(next);
  },
  
  getStates: function(req, res, next){
    gladys.launcher.getStates({id: req.params.id})
      .then(function(states){
        return res.json(states);
      })
      .catch(next);
  },
  
  

};

