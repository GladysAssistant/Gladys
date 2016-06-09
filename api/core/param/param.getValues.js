var Promise = require('bluebird');

module.exports = function(array){
   
   // foreach element in array
   return Promise.map(array, function(name){
       return gladys.param.getValue(name);
   });
};