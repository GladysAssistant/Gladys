/**
 * ModeController
 *
 * @description :: Server-side logic for managing modes
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    
    index: function(req, res, next){
        gladys.mode.get()
          .then(function(modes){
              return res.json(modes);
          })
          .catch(next);
    },
    
    create: function(req, res, next){
        gladys.mode.create(req.body)
          .then(function(mode){
              return res.status(201).json(mode);
          })
          .catch(next);
    },
    
    delete: function(req, res, next){
        gladys.mode.delete({id: req.params.id})
          .then(function(){
              return res.json({success: true});
          })
          .catch(next);
    },
    
    change: function(req, res, next){
        req.body.house = req.params.id;
        gladys.mode.change(req.body)
          .then(function(event){
              return res.json(event);
          })
          .catch(next);
    }
	
};

