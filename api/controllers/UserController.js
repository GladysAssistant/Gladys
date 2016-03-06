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
    
    
    
   create: function(req, res, next){
       
   },

  /**
   * Get all the users
   * @method index
   * @param {} req
   * @param {} res
   * @param {} next
   * @return
   */
  index: function(req, res, next) {
    var request = "SELECT id,firstname, lastname, CONCAT(firstname, ' ', lastname) AS name FROM user";
    User.query(request, [], function(err, users) {
      if (err) return res.json(err);

      res.json(users);
    });
  },
  
  setPreparationTime: function(req,res,next){
     User.update({id:req.session.User.id}, {preparationTimeAfterWakeUp: req.param('preparationTime')})
      .exec(function(err, user){
          if(err) return res.json(err);
          
          return res.json(user);
      });
  },
  
  setAssistantName: function(req, res,next){
     User.update({id:req.session.User.id}, {assistantName: req.param('assistantName')})
      .exec(function(err, user){
          if(err) return res.json(err);
          
          return res.json(user);
      });
  },

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
      parametres: req.session.User.parametres,
      atHome: req.session.User.atHome,
      id: req.session.User.id
    };
    res.json(user);
  }

};