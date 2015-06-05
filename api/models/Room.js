/** 
  * Gladys Project
  * http://gladysproject.com
  * Software under licence Creative Commons 3.0 France 
  * http://creativecommons.org/licenses/by-nc-sa/3.0/fr/
  * You may not use this software for commercial purposes.
  * @author :: Pierre-Gilles Leymarie
  */
  
/**
* Room.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {

    name :{
      type:'string',
      required:true
    },

    sleepers:{
        collection:'User',
        via:'roomwheresleep'
    },

    house:{
        model:'House',
        required:true
    },

    timeBeforeEmpty:{
        type:'integer',
        defaultsTo: sails.config.room.defaultTimeBeforeEmpty
    },

    permission:{
        type:'integer'
    },

    motionsensors:{
        collection: 'MotionSensor',
        via: 'room'
    },

    phenixelectricdevices:{
        collection: 'PhenixElectricDevice',
        via: 'room'
    },

    milightlamps:{
        collection: 'MilightLamp',
        via: 'room'
    },

    temperaturesensor:{
        collection: 'TemperatureSensor',
        via: 'room'
    }

  },

   afterDestroy: function(values, next){

    var nbOk = 0;
    var i;
    var nbThingsToDestroy = 4;
    var checkifAllDestroyed = function(){

        if(nbOk == values.length*nbThingsToDestroy)
            next();
    }

    if(values.length == 0)
        return next();

    for(i = 0; i<values.length;i++){
        MotionSensor.destroy({room: values[i].id}, function(err, motionsensor){
            if(err) return next(err);

            nbOk++;
            checkifAllDestroyed();
        });

        PhenixElectricDevice.destroy({room: values[i].id}, function(err, phenixelectricdevice){
            if(err) return next(err);

            nbOk++;
            checkifAllDestroyed();
        });

        TemperatureSensor.destroy({room : values[i].id}, function(err, temperaturesensor){
            if(err) return next(err);

            nbOk++;
            checkifAllDestroyed();
        });

        MilightLamp.destroy({room: values[i].id}, function(err, milightlamp){
            if(err) return next(err);

            nbOk++;
            checkifAllDestroyed();
        });
    }
   }

};

