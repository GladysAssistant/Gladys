var queries = require('./param.queries.js');
var Promise = require('bluebird');

module.exports = function getValue(name){
    
    // get value in db
    return gladys.utils.sql(queries.getValue, [name])
      .then(function(values){
         
         if(values.length === 0){
             return Promise.reject(new Error('Param not found'));
         } 
         
         return values[0].value;
      });
};