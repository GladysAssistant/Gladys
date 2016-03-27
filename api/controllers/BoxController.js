/**
 * BoxController
 *
 * @description :: Server-side logic for managing boxes
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    
    
    /**
     * Get all boxs for the connected user
     */
    index: function(req, res, next){
       gladys.box.getBoxUser({user: req.session.User})
        .then(function(boxs){
            return res.json(boxs);
        })  
        .catch(next); 
    },
    
    
    create: function(req, res, next){
        
      req.body.user = req.session.User.id;
      gladys.box.create(req.body)
        .then(function(box){
            return res.json(box);
        })  
        .catch(next);
    },
    
    update: function(req, res, next){
        req.body.id = req.params.id;
        gladys.box.update(req.body)
          .then(function(box){
              return res.json(box);
          })
          .catch(next);
    },
    
    /**
     * Delete a box
     */
    delete: function(req, res, next){
        gladys.box.delete({id: req.params.id})
          .then(function(box){
              return res.json(box);
          })
          .catch(next);
    }
	
};

