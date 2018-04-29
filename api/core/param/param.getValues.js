var Promise = require('bluebird');

/**
 * @public
 * @description This function retrun the values of the params
 * @name gladys.param.getValues
 * @param {Array} array Array of the name of the params
 * @returns {Array<param>} param
 * @example
 * var array = ['param_1', 'param_2', 'param_3']
 * 
 * gladys.param.getValues(array)
 *     .then(function(param){
 *        // do something
 *     })
 */

module.exports = function(array){
   
   // foreach element in array
   return Promise.map(array, function(name){
       return gladys.param.getValue(name);
   });
};