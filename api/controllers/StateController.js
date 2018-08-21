
module.exports = {
    
    create: function(req, res, next){
        gladys.state.create(req.body)
          .then(function(state){
              return res.status(201).json(state);
          })
          .catch(next);
    },  
    
    delete: function(req, res, next){
        gladys.state.delete({id: req.params.id})
          .then(function(){
              return res.json({success: true});
          })
          .catch(next);
    },
    
    update: function(req, res, next){
        req.body.id = req.params.id;
        gladys.state.update(req.body)
          .then(function(state){
              return res.json(state);
          })
          .catch(next);
    },
    
    addParam: function(req, res, next){
        req.body.state = req.params.id;
        gladys.stateParam.create(req.body)
          .then(function(param){
             return res.status(201).json(param); 
          })
          .catch(next);
    }
};

