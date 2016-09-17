/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
 * UserController
 *
 * @description :: Server-side logic for managing users
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

module.exports = {
    
    /**
     * Get all users
     */
   index: function(req, res, next){
      gladys.user.get()
        .then(function(users){
           return res.json(users); 
        })
        .catch(next);
   },
   
   /**
    * Create a user
    */
   create: function(req, res, next){
       gladys.user.create(req.body)
         .then(function(user){
             return res.status(201).json(user);
         })
         .catch(next);
   },
   
   /**
    * User login
    */
   login: function(req, res, next){
       gladys.user.login(req.body)
         .then(function(user){
           
           // user is logged in
           req.session.User = user;
           req.session.authenticated = true;
           req.session.trueHuman = true;  
           sails.log.info(`User connected ${user.firstname}`);
           
           return res.json(user);  
         })
         .catch(next);
   },
   
   /**
    * Update a user
    */
   update: function(req, res, next){
       if(req.params.id != req.session.User.id){
          return res.forbidden('You cannot modify another user than you.');
       }

       req.body.id = req.params.id;
       gladys.user.update(req.body)
         .then(function(user){

             if(req.params.id == req.session.User.id){
                req.session.User = user;
             }

             return res.json(user);
         })
         .catch(next);
   },
   
   /**
    * Delete a user
    */
   delete: function(req, res, next){
       gladys.user.delete({id: req.params.id})
         .then(function(user){
             return res.json(user);
         })
         .catch(next);
   },

/**
 * return the current connected user
 */
  whoami: function(req, res, next){
    var user = {
      firstname: req.session.User.firstname,
      lastname: req.session.User.lastname,
      email: req.session.User.email,
      birthdate: req.session.User.birthdate,
      gender: req.session.User.gender,
      language: req.session.User.language,
      assistantName: req.session.User.assistantName,
      preparationTimeAfterWakeUp: req.session.User.preparationTimeAfterWakeUp,
      id: req.session.User.id
    };
    res.json(user);
  }

};