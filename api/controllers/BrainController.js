


module.exports = {
    
    
    classify: function(req, res, next){
        gladys.brain.classify(req.query.q)
              .then(function(result){
                return res.json(result);
              })
              .catch(next);
    }
	
};

