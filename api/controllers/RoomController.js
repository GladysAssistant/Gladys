/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * RoomController
 * @description :: Server-side logic for managing rooms
 * @help :: See http://links.sailsjs.org/docs/controllers
 */


module.exports = {
    
    /**
     * Get rooms with pagination
     */
    index: function(req, res, next){
        gladys.room.get(req.query)
          .then(function(rooms){
              return res.json(rooms);
          })
          .catch(next);
    },
    
    /**
     * Create a room
     */
    create: function(req, res, next){
        gladys.room.create(req.body)
          .then(function(room){
              return res.status(201).json(room);
          })
          .catch(next);
    },
    
    /**
     * Update a room
     */
    update: function(req, res, next){
        
        req.body.id = req.params.id;
        gladys.room.update(req.body)
          .then(function(room){
              return res.json(room);
          })
          .catch(next);
    },
    
    /** 
     * Delete a room
     */
    delete: function(req, res, next){
        gladys.room.delete({id: req.params.id})
          .then(function(room){
              return res.json(room);
          })
          .catch(next);
    }
};

