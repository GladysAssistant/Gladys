var queries = require('./mode.queries.js');

module.exports = function(params){

  if(!params.house || !params.mode){
      return Promise.reject(new Error('Missing parameters'));
  }

  // get mode id
  return gladys.utils.sqlUnique(queries.getByCode, [params.mode])
    .then((mode) => {
        
        return gladys.event.create({
            code: 'house-mode-changed',
            house: params.house,
            value: params.mode,
            scope: {
                mode: mode.id
            }
        });  
    });
};