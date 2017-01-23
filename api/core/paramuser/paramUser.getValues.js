var Promise = require('bluebird');

module.exports = function(array){
   
   // foreach element in array
   return Promise.map(array, function(params){
       return gladys.paramUser.getValue(params.name, params.user);
   });
};