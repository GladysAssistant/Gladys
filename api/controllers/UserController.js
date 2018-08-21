  
/**
 * @apiDefine UserSuccess
 * @apiSuccess {String} firstname Firstname
 * @apiSuccess {String} lastname  Lastname
 * @apiSuccess {String} email  Email
 * @apiSuccess {date} birthdate  Birthdate
 * @apiSuccess {integer} gender  gender
 * @apiSuccess {String} language  language of the user
 * @apiSuccess {String} assistantName  The name of your assistant for you
 * @apiSuccess {integer} preparationTimeAfterWakeUp  Time to prepare after wake up 
 * @apiSuccess {String=admin, habitant, guest} role  The role of the user in the system
 */

/**
 * @apiDefine UserParam
 * @apiSuccess {String} firstname Firstname
 * @apiSuccess {String} lastname  Lastname
 * @apiSuccess {String} email  Email
 * @apiSuccess {date} birthdate  Birthdate
 * @apiSuccess {integer} gender  gender
 * @apiSuccess {String} language  language of the user
 * @apiSuccess {String} password  A Password
 * @apiSuccess {String} assistantName  The name of your assistant for you
 * @apiSuccess {integer} preparationTimeAfterWakeUp  Time to prepare after wake up 
 * @apiSuccess {String=admin, habitant, guest} role  The role of the user in the system
 */
module.exports = {
    
    /**
   * @api {get} /user get all users
   * @apiName getUsers
   * @apiGroup User
   * @apiPermission authenticated
   * @apiPermission admin
   * 
   * @apiUse UserSuccess
   */
   index: function(req, res, next){
      gladys.user.get()
        .then(function(users){
           return res.json(users); 
        })
        .catch(next);
   },
   
    /**
   * @api {post} /user create a user
   * @apiName createUser
   * @apiGroup User
   * @apiPermission authenticated
   * @apiPermission admin
   * 
   * @apiUse UserParam
   * 
   * @apiUse UserSuccess
   */
   create: function(req, res, next){
       gladys.user.create(req.body)
         .then(function(user){
             return res.status(201).json(user);
         })
         .catch(next);
   },
   
   /**
   * @api {post} /user/user Login
   * @apiName LoginUser
   * @apiGroup User
   * 
   * @apiParam {String} email Email
   * @apiParam {String} password Password
   * 
   * @apiUse UserSuccess
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
   * @api {patch} /user/:id update a user
   * @apiName updateUser
   * @apiGroup User
   * @apiPermission authenticated
   * 
   * @apiUse UserParam
   * 
   * @apiUse UserSuccess
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
   * @api {patch} /user/:id/password change my password
   * @apiName updateUserPassword
   * @apiGroup User
   * @apiPermission authenticated
   * 
   * @apiParam {string} oldPassword The old password of the account
   * @apiParam {string} newPassword The new password for the account
   * @apiParam {string} newPasswordRepeat The new password repeated
   * 
   * @apiUse UserSuccess
   */
   changePassword: function(req, res, next){
    if(req.params.id != req.session.User.id){
      return res.forbidden('You cannot modify another user than you.');
    }

    req.body.id = req.params.id;
    gladys.user.changePassword(req.body)
      .then((user) => res.json(user))
      .catch((err) => {
        if(err.message) return res.badRequest({code:err.message});
        else return next(err);
      });
   },
   
   /**
   * @api {delete} /user/:id delete a user
   * @apiName deleteUser
   * @apiGroup User
   * @apiPermission authenticated
   * @apiPermission admin
   * 
   * @apiUse UserSuccess
   */
   delete: function(req, res, next){
       gladys.user.delete({id: req.params.id})
         .then(function(user){
             return res.json(user);
         })
         .catch(next);
   },

  /**
   * @api {get} /user/whoami WhoAmI
   * @apiName WhoAmIUser
   * @apiGroup User
   * @apiPermission authenticated
   * 
   * @apiDescription Return currently connected user
   * 
   * @apiUse UserSuccess
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
      role: req.session.User.role,
      id: req.session.User.id
    };
    res.json(user);
  },

  /**
   * @api {post} /user/:id/house/:id/seen Mark user as seen
   * @apiName Mark user as seen
   * @apiGroup User
   * @apiPermission authenticated
   * 
   * @apiDescription Mark user as seen in a house
   * 
   */
  seen: function(req, res, next){
    gladys.house.userSeen({user: req.params.user_id, house: req.params.house_id})
      .then((result) => res.json(result))
      .catch(next);
  }

};