/**
 * EventController
 *
 * @description :: Server-side logic for managing events
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    
    /** 
     * Return all events from a specific user
     */
    index: function(req, res, next){
        req.query.user = req.session.User;
        gladys.event.get(req.query)
          .then(function(events){
              return res.json(events);
          })
          .catch(next);
    },
    
    create: function(req, res, next){
        
    },
    
    update: function(req, res, next){
        
    },
    
    delete: function(req, res, next){
        
    }
	
};

