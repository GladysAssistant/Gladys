var queries = require('./param.queries.js');
var Promise = require('bluebird');
var shared = require('./param.shared.js');

module.exports = function getValue(name){
    
    if(shared.cache.hasOwnProperty(name)){
        return Promise.resolve(shared.cache[name]);
    }
    
    // get value in db
    return gladys.utils.sql(queries.getValue, [name])
      .then(function(values){
         
         if(values.length === 0){
             return Promise.reject(new Error(`Param ${name} not found`));
         } 
         
         shared.cache[name] = values[0].value;
         
         return Promise.resolve(values[0].value);
      });
};