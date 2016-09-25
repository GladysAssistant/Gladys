var queries = require('./house.queries.js');

module.exports = function get (options){
    
    return gladys.utils.sql(queries.isUserAtHome, [options.house, options.user])
      .then((rows) => {
          
          // if user is present in house, 
          // we have a row
          return (rows.length > 0);
        });
};