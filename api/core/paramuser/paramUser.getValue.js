var queries = require('./paramUser.queries.js');
var shared = require('./paramUser.shared.js');
var setCacheValue = require('./paramUser.setCacheValue.js');
var Promise = require('bluebird');

/**
 * @public
 * @description This function retrun the value an param of an user
 * @name gladys.paramUser.getValue
 * @param {String} name The name of the param
 * @param {integer} userId The id of the user we want get param value
 * @returns {String} param
 * @example
 * var name = 'param_1'
 * var userId = 1
 * 
 * gladys.paramUser.getValue(name, userId)
 *     .then(function(param){
 *        // do something
 *     })
 */

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
