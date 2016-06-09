/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * HouseController
 *
 * @description :: Server-side logic for managing Houses
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    
    /**
     * Get all houses
     */
    index: function(req, res, next){
        gladys.house.get()
          .then(function(houses){
              return res.json(houses);
          })
          .catch(next);
    },
    
    /**
     * Create a house
     */
    create: function(req, res, next){
        gladys.house.create(req.body)
          .then(function(house){
              return res.status(201).json(house);
          })
          .catch(next);
    },
    
    /**
     * Update a house
     */
    update: function(req, res, next){
        
        req.body.id = req.params.id;
        gladys.house.update(req.body)
          .then(function(house){
              return res.json(house);
          })
          .catch(next);
    },
    
    /**
     * Delete a house
     */
    delete: function(req, res, next){
        req.body.id = req.params.id;
        gladys.house.delete(req.body)
          .then(function(house){
              return res.json(house);
          })
          .catch(next);
    },
    
    getUsers: function(req, res, next){
        gladys.house.getUsers({house: req.params.id})
          .then(function(users){
              return res.json(users);
          })
          .catch(next);
    }

};

