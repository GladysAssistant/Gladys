


module.exports = {
    
    
    classify: function(req, res, next){
        gladys.brain.classify(req.query.q)
              .then(function(result){
                return res.json(result);
              })
              .catch(next);
    },
    
    /**
     * Train a new classifier with sentences
     * in DB
     */
    trainNew: function(req, res, next){
        gladys.brain.trainNew()
          .then(function(){
              return res.json({result: 'Brain trained with success'});
          })
          .catch(next);
    }
	
};

