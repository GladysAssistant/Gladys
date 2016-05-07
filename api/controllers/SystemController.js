

module.exports = {
    
    index: function(req, res, next){
        gladys.system.getInfos()
          .then(function(infos){
              return res.json(infos);
          })
          .catch(next);
    }
}