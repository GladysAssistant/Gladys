var queries = require('./param.queries.js');

module.exports = function setValue(param){
    
    // we test if the param exist
    return gladys.utils.sql(queries.getValue, [param.name])
      .then(function(params){
          
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