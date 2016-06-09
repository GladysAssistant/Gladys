

module.exports = {
  
  index: function(req, res, next){
      gladys.area.get(req.session.User)
        .then(function(areas){
            return res.json(areas);
        })
        .catch(next);
  },
  
  create: function(req, res, next){
      req.body.user = req.session.User.id;
      gladys.area.create(req.body)
        .then(function(area){
            return res.status(201).json(area);
        })
        .catch(next);
  },
  
  update: function(req, res, next){
      req.body.id = req.params.id;
      gladys.area.update(req.body)
        .then(function(area){
            return res.json(area);
        })
        .catch(next);
  },
  
  delete: function(req, res, next){
      gladys.area.delete({id: req.params.id})
        .then(function(){
            return res.json({success: true});
        })
        .catch(next);
  }
    
};