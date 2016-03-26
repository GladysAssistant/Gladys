

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
     }
};