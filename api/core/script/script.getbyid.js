var queries = require('./script.queries.js');
var Promise = require('bluebird');

module.exports = function(options){
    
  if(!options || !options.script || !options.script.id || !options.user || !options.user.id){
      return Promise.reject(new Error('Wrong parameters'));
  }
    
  return gladys.utils.sql(queries.getById, [options.script.id, options.user.id])
       .then(function(scripts){
           if(scripts.length === 0){
               return Promise.reject(new Error('Script not found'));
           }
           
           return Promise.resolve(scripts[0]);
       });
};