var queries = require('./mode.queries.js');

/**
 * @public
 * @description This function change mode of an house
 * @name gladys.mode.change
 * @param {Object} params
 * @param {integer} params.house The house we want to change the mode
 * @param {String} params.mode The code of the mode
 * @returns {Mode} mode
 * @example
 * var params = {
 *      house: 1,
 *      mode: "romantic"
 * }
 * 
 * gladys.mode.change(params)
 *      .then(function(mode){
 *          // do something
 *      })
 */

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