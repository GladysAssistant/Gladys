var queries = require('./param.queries.js');
var shared = require('./param.shared.js');

module.exports = function createValue(param){
    
    // we test if the param exist
    return gladys.utils.sql(queries.getValue, [param.name])
      .then(function(params){
          
          shared.cache[param.name] = param.value;
          
          // if not
          if(params.length !> 0){
              
              // we create the param
              return Param.create(param);
          } else {
              
              // we inform
          }
      });
};
