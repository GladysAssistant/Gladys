/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
* House.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

    name:{
      type:'string',
      required:true
    },

  	address:{
  		type:'string',
      required:true
  	},

  	city:{
  		type:'string',
      required:true
  	},

    postcode :{
      type:'integer',
      required:true
    },

    country:{
      type:'string',
      required:true
    },

    latitude:{
      type:'float'
    },

    longitude:{
      type:'float'
    },

    rooms:{
        collection: 'Room',
        via: 'house'
    },

    userrelation:{
      collection: 'UserHouseRelation',
      via: 'house'
    },

    usersInside :{
        collection: 'User',
        via: 'atHome'
    },

  },

  beforeCreate: function (values, next) {

    // If no latitude and longitude are set, get them

      if (!values.latitude && !values.longitude) {
          var address = values.address + ' ' + values.postcode + ' ' + values.city + ' ' + values.country;
          AddressToCoordinateService.geocode(address, function(err, latitude, longitude){
              if(!err){
                values.latitude = latitude;
                values.longitude = longitude;
              }
              next(); 
          });
      }else
      {
         next();
      }
   },

   afterDestroy: function(values, next){

      var nbOk = 0;
      var i;
      var nbThingsToDestroy = 2;
      var checkifAllDestroyed = function(){
        if(nbOk == values.length*nbThingsToDestroy)
            next();
      };

      if(values.length === 0)
          return next();

      for(i = 0; i<values.length;i++){
        UserHouseRelation.destroy({house: values[i].id}, function UserHouseRelationDestroyed(err, userHouseRelation){
            if(err) return next(err);

            nbOk++;         
            checkifAllDestroyed();
      });

        Room.destroy({house : values[i].id}, function roomDestroyed(err, room){
            if(err) return next(err);

            nbOk++;
            checkifAllDestroyed();
        });
      }
   }

};

