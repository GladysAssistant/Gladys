var queries = require('./deviceType.queries.js');
var Promise = require('bluebird');

module.exports = function(id){
    
    // get state for a given devicetype id
    return gladys.utils.sql(queries.getById, [id])
      .then(function(deviceType){
         // if there is vale for this id 
         if(deviceType.length){
             // return deviceType
             return deviceType; 
         } else {
             return null;
         }
         
      });
}
