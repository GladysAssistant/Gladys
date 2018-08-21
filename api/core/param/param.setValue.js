var queries = require('./param.queries.js');
var shared = require('./param.shared.js');

/**
 * @public
 * @description This function set value of an param
 * @name gladys.param.setValue
 * @param {Object} param
 * @param {String} param.name The name of the param, it must be unique
 * @param {String} param.value The value of the param
 * @returns {Param} param
 * @example
 * var param = {
 *      name: "api_key",
 *      value: "djfudf5d95f23d6d5f5"
 * }
 * 
 * gladys.param.setValue(param)
 *      .then(function(param){
 *          // value seted
 *      })
 */

module.exports = function setValue(param){
    
    // we test if the param exist
    return gladys.utils.sql(queries.getValue, [param.name])
      .then(function(params){
          
          shared.cache[param.name] = param.value;
          
          // if yes
          if(params.length > 0){
              
              // we update the param
              return Param.update({id: params[0].id}, param)
                .then(function(params){ 
                    return params[0];
                });
          } else {
              
              // we create the param
              return Param.create(param);
          }
      });
};