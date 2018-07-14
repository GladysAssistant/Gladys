
module.exports = {
    
    index: function(req, res, next){
        gladys.stateType.get()
          .then(function(stateTypes){
              return res.json(stateTypes);
          })
          .catch(next);
    },
    
    getTemplateParams: function(req, res, next){
        
        gladys.stateTemplateParam.getByStateType({statetype: req.params.id})
          .then(function(stateTemplateParams){
              return res.json(stateTemplateParams);
          })
          .catch(next);
    },
    
    getStateTypeParams: function(req, res, next){
        
        gladys.stateTypeParam.getByStateType({statetype: req.params.id})
          .then(function(stateTypeParams){
              return res.json(stateTypeParams);
          })
          .catch(next);
    }
	
};

