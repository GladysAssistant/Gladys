

module.exports = {
     
     /**
      * Verify if new update are available
      */
     verify: function(req, res, next){
         gladys.update.checkUpdate()
           .then(function(result){
               return res.json(result);
           })
           .catch(next);
     },
     
     /**
      * Check for new boxTypes
      */
     updateBoxTypes: function(req, res, next){
         gladys.update.getBoxTypes(req.session.User)
           .then(function(result){
              return res.json(result); 
           })
           .catch(next);
     },
     
     /**
      * Check for new boxTypes
      */
     updateEvents: function(req, res, next){
         gladys.update.getEvents(req.session.User)
           .then(function(result){
              return res.json(result); 
           })
           .catch(next);
     },
     
     /**
      * Check for new Modes
      */
     updateModes: function(req, res, next){
         gladys.update.getModes(req.session.User)
           .then(function(result){
              return res.json(result); 
           })
           .catch(next);
     },
     
     /**
      * Check for new Sentences
      */
     updateSentences: function(req, res, next){
         gladys.update.getSentences(req.session.User)
           .then(function(result){
              return res.json(result); 
           })
           .catch(next);
     },
     
     /**
      * Check for new categories
      */
      updateCategories: function(req, res, next){
          gladys.update.getCategories(req.session.User)
            .then(function(result){
                return res.json(result); 
            })
            .catch(next);
      }
      
};