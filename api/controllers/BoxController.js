/**
 * BoxController
 *
 * @description :: Server-side logic for managing boxes
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    
    
    update: function(req, res, next){
        req.body.id = req.params.id;
        gladys.box.update(req.body)
          .then(function(box){
              return res.json(box);
          })
          .catch(next);
    }
	
};

