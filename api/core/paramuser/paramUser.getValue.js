var queries = require('./paramUser.queries.js');
var shared = require('./paramUser.shared.js');
var setCacheValue = require('./paramUser.setCacheValue.js');
var Promise = require('bluebird');


module.exports = function(name, userId){
   
   // get from cache
   if(shared.cache[userId] && shared.cache[userId][name]){
       return Promise.resolve(shared.cache[userId][name]);
   }
    
  // if not in cache, get in DB
  return gladys.utils.sql(queries.getValue, [name, userId])
    .then(function(rows){
       if(rows.length){
           setCacheValue(name, userId, rows[0].value);
           return rows[0].value;
       } else {
           return Promise.reject(new Error('NotFound'));
       }
    });
};
