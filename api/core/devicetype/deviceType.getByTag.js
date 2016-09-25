var queries = require('./deviceType.queries.js');
var Promise = require('bluebird');

module.exports = function(tag){
    
    // get all deviceTypes for a given tag
    return gladys.utils.sql(queries.getByTag, [tag])
      .then(function(deviceTypes){
         // if there is some deviceTypes for this tag
         if(deviceTypes.length){
             // return deviceTypes
             return deviceTypes; 
         } else {
             return null;
         }
         
      });
}
