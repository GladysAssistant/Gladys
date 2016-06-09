var queries = require('./mode.queries.js');

module.exports = function create(mode){
    
    // checking if mode already exist
    return gladys.utils.sql(queries.getByCode, [mode.code])
      .then(function(modes){
         
         if(modes.length){
             
             // mode already exist
             return Promise.resolve(modes[0]);
         } else {
             
             sails.log.info(`Mode : create : Creating mode ${mode.code}`);
             return Mode.create(mode);
         }
      });
};