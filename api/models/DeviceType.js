/**
* DeviceType.js
*
* @description :: TODO: You might write a short summary of how this model works and what it represents here.
* @docs        :: http://sailsjs.org/#!documentation/models
*/

module.exports = {

  attributes: {
      
      type: {
          type: 'string',
          required: true
      },
      
      unit: {
          type:'string'
      },
      
      min: {
          type: 'integer'
      },
      
      max: {
          type: 'integer'
      },
      
      device: {
          model: 'Device'  
      }

  },
  
    afterDestroy: function (deviceTypes, cb){
      
      // removing all deviceState associated with a specific deviceType
      //DeviceState.destroy({devicetype: criteria.id}, cb);
      async.each(deviceTypes, function(type, cb){
         DeviceState.destroy({devicetype: type.id}, cb);  
      }, cb);
  }
};

