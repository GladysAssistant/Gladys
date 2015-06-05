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
var crypto = require('crypto');

/**
 * Test if the user is allowed to get/modify the house
 * @method haveRights
 * @param {} user
 * @param {} house
 * @param {} callback
 * @return 
 */
var haveRights = function (user,house,callback){
     UserHouseRelation.findOne({house: house, user: user, userhouserelationtype: sails.config.userhouserelationtype.Admin }, function(err, userHouseRelation){
          if(err) callback(err);

          if(!userHouseRelation){
              callback(false, false);
          }else{
              callback(false,userHouseRelation);
          }
     });
};



module.exports = {

  /**
   * Get all the houses that the connected user can control
   * @method index
   * @param {} req
   * @param {} res
   * @param {} next
   * @return 
   */
  index : function(req,res,next){

      UserHouseRelation.find({ user: req.session.User.id,userhouserelationtype: sails.config.userhouserelationtype.Admin })
      .populate('house')
      .exec(function foundHouses(err,UserHouseRelation ) {
          if (err)  return res.json(err);
          res.json(UserHouseRelation);
      });
  },
	
	/**
	 * Create a new House
	 * @method create
	 * @param {} req
	 * @param {} res
	 * @param {} next
	 * @return 
	 */
	create : function (req, res, next){

  	var HouseObj = {
      name: req.param('name'),
      address: req.param('address'),
      city: req.param('city'),
      postcode: req.param('postcode'),
      country: req.param('country')
    };

  	House.create(HouseObj, function HouseCreated(err,house){
  			if(err) res.json(err);
  			
        var UserHouseRelationObj = {
            user:req.session.User.id,
            house:house.id,
            userhouserelationtype: sails.config.userhouserelationtype.Admin
        };
        UserHouseRelation.create(UserHouseRelationObj, function UserHouseRelationCreate(err,UserHouseRelationcreated){
            if(err) res.json(err);

            res.json(house);
        });

  		});
  },

  /**
   * Destroy a given House (and everything in the house (room, sensors) )
   * @method destroy
   * @param {} req
   * @param {} res
   * @param {} next
   * @return 
   */
  destroy : function (req,res,next){

    haveRights(req.session.User.id, req.param('id'), function (err, userHouseRelation){
          if(err) return res.json(err);

          if(!userHouseRelation)
              return res.forbidden('You can\'t destroy this house');

          House.destroy(req.param('id'), function houseDestroyed(err, house){
                  if(err) res.json(err);

                  return res.json(house);
          });

    });
  },

  /**
   * Add Relation between a given user and a given house
   * @method addrelation
   * @param {} req
   * @param {} res
   * @param {} next
   * @return 
   */
  addrelation: function (req,res,next){
        haveRights(req.session.User.id, req.param('house'), function (err, userHouseRelation){
                if(err) res.json(err);

                if(!userHouseRelation)
                    res.forbidden('You are not admin of this house.');

                var UserHouseRelationObj = {
                    user:req.param('user'),
                    house:req.param('house'),
                    userhouserelationtype: req.param('relation')
                };

                UserHouseRelation.create(UserHouseRelationObj, function UserHouseRelationCreate(err,UserHouseRelation){
                    if(err) res.json(err);

                    res.json(UserHouseRelation);
                });
        });
  }, 

  /**
   * Get all the relations of a house 
   * @method getrelationhouse
   * @param {} req
   * @param {} res
   * @param {} next
   * @return 
   */
  getrelationhouse: function(req,res,next){
                var request = "SELECT userhouserelation.id AS id, user.id AS userId, CONCAT(user.firstname, ' ', user.lastname) as userName, house.id as houseId, house.name as houseName, userhouserelationtype "
                request+= "FROM userhouserelation ";
                request+= "JOIN user ON (userhouserelation.user = user.id) ";
                request+= "JOIN house ON (userhouserelation.house = house.id) ";
                request+= "WHERE house IN ( SELECT house FROM userhouserelation WHERE userhouserelationtype = 1 ";
                request+= "AND user = ?) ";
               
                UserHouseRelation.query(request,[req.session.User.id], function UserHouseRelation(err,UserHouseRelation){
                    if(err) res.json(err);

                    res.json(UserHouseRelation);
                });
  },

  /**
   * Destroy a relation between a house and a user
   * @method destroyrelationhouse
   * @param {} req
   * @param {} res
   * @param {} next
   * @return 
   */
  destroyrelationhouse : function(req,res,next){ 
    UserHouseRelation.findOne({id:req.param('id')}, function(err, userHouseRelation){
        if(err) return res.json(err);

        if(!userHouseRelation)
            return res.json('not found');

        haveRights(req.session.User.id, userHouseRelation.house, function (err, userHouseRelation){
            if(err) res.json(err);

            if(!userHouseRelation)
                return res.forbidden('You are not admin of this house.');

            UserHouseRelation.destroy({id:req.param('id')}, function(err, userHouseRelation){
                if(err) return res.json(err);

                res.json(userHouseRelation);
            });
        });  
    });
    
  },

  /**
   * Description
   * @method getCountryList
   * @param {} req
   * @param {} res
   * @param {} next
   * @return 
   */
  getCountryList: function(req,res,next){
      if(req.getLocale() == 'fr')
      {
         // res.json()
      }
  }

};

