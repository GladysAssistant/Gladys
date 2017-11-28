var queries = require('./house.queries.js');

module.exports = function isUserAtHome(options){
    
    return gladys.utils.sql(queries.isUserAtHome, [options.house, options.user])
      .then((rows) => {
          
          // if user is present in house, return true
          if (rows.length) return true;

          return false;
        });
};